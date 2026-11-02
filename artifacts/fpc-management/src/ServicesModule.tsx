import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ShoppingBag, Search, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  CheckCircle2, Clock, Truck, Warehouse, Building2, Download, Printer,
  X, AlertCircle, FileText, ChevronDown, RefreshCw, Calendar, Phone,
  MapPin, ShieldCheck, Check, PackageCheck, Ban
} from "lucide-react";
import type { Role } from "@/lib/config";
import {
  type RecordRow, type State, type FpcStoreLocation,
  fpcStores, amountToWords, money
} from "@/lib/store";
import "./services-module.css";

interface Props {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  role: Role;
  setToast: (msg: string) => void;
  go?: (dest: string) => void;
}

interface CartItem {
  id: string;
  name: string;
  category: string;
  packSize: string;
  unit: string;
  rate: number;
  stock: number;
  gst: number;
  quantity: number;
}

export default function ServicesModule({ state, setState, role, setToast, go }: Props) {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [isCheckout, setIsCheckout] = useState(false);

  // Cart state: item ID -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});

  // Catalog filtering state
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Checkout Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  const [selectedStoreId, setSelectedStoreId] = useState("STR-01");
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [orderRemarks, setOrderRemarks] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Modals
  const [confirmedPO, setConfirmedPO] = useState<RecordRow | null>(null);
  const [viewingPO, setViewingPO] = useState<RecordRow | null>(null);
  const [receivingPO, setReceivingPO] = useState<RecordRow | null>(null);
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({});
  const [challanNumber, setChallanNumber] = useState("");
  const [receivingNotes, setReceivingNotes] = useState("");

  // History filtering state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) {
        setIsStoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Masters from state
  const suppliers: RecordRow[] = useMemo(() => {
    return (state.records?.suppliers || []).filter(s => s.status !== "Inactive");
  }, [state.records?.suppliers]);

  const godowns: RecordRow[] = useMemo(() => {
    return state.records?.godowns || [];
  }, [state.records?.godowns]);

  // Combined available delivery stores & godowns
  const allStores = useMemo(() => {
    const list: Array<{ id: string; name: string; location: string; address: string; manager: string; phone: string }> = [];
    fpcStores.forEach(s => {
      list.push({
        id: s.id,
        name: s.name,
        location: s.location,
        address: s.address || `${s.location}, Keonjhar, Odisha`,
        manager: s.manager,
        phone: s.phone
      });
    });
    godowns.forEach(g => {
      if (!list.some(item => item.id === g.id || item.name === g.name)) {
        list.push({
          id: g.id,
          name: g.name,
          location: g.location || "Keonjhar",
          address: (g.address as string) || `Plot No. 12, Industrial Estate, Keonjhar Sadar, Odisha`,
          manager: (g.manager as string) || "Sanjay Tudu",
          phone: "+91 9437004412"
        });
      }
    });
    return list;
  }, [godowns]);

  // Input Catalog items
  const catalogItems = useMemo(() => {
    return state.inputCatalog || [];
  }, [state.inputCatalog]);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    catalogItems.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [catalogItems]);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return catalogItems.filter(p => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchQuery = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q)) ||
        (p.batch && p.batch.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [catalogItems, catalogSearch, selectedCategory]);

  // Cart Items with calculations
  const cartItems: CartItem[] = useMemo(() => {
    return catalogItems
      .filter(p => (cart[p.id] || 0) > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || "Inputs",
        packSize: p.packSize || "Standard",
        unit: p.unit || "unit",
        rate: Number(p.rate) || 0,
        stock: Number(p.stock) || 0,
        gst: Number(p.gst ?? 5),
        quantity: cart[p.id] || 0
      }));
  }, [catalogItems, cart]);

  // Cart summary totals
  const { cartSubtotal, cartGstTotal, cartGrandTotal, totalCartQuantity } = useMemo(() => {
    let subtotal = 0;
    let gstTotal = 0;
    let totalQty = 0;

    cartItems.forEach(item => {
      const lineSub = item.rate * item.quantity;
      const lineGst = (lineSub * item.gst) / 100;
      subtotal += lineSub;
      gstTotal += lineGst;
      totalQty += item.quantity;
    });

    return {
      cartSubtotal: subtotal,
      cartGstTotal: gstTotal,
      cartGrandTotal: subtotal + gstTotal,
      totalCartQuantity: totalQty
    };
  }, [cartItems]);

  // Purchase Orders list
  const purchaseOrders: RecordRow[] = useMemo(() => {
    const list = (state.records?.purchaseOrders || state.purchaseOrders || []) as RecordRow[];
    return [...list].sort((a, b) => (b.id || "").localeCompare(a.id || ""));
  }, [state.records?.purchaseOrders, state.purchaseOrders]);

  // Filtered Purchase Orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim();
    return purchaseOrders.filter(po => {
      const matchStatus = orderStatusFilter === "All" || po.status === orderStatusFilter;
      const matchSearch = !q ||
        (po.poNumber && po.poNumber.toLowerCase().includes(q)) ||
        (po.supplierName && po.supplierName.toLowerCase().includes(q)) ||
        (po.storeName && po.storeName.toLowerCase().includes(q)) ||
        (po.items && Array.isArray(po.items) && po.items.some((it: any) => it.name && it.name.toLowerCase().includes(q)));
      return matchStatus && matchSearch;
    });
  }, [purchaseOrders, orderSearch, orderStatusFilter]);

  // Metrics for PO History
  const orderMetrics = useMemo(() => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter(o => o.status === "Pending Delivery").length;
    const partial = purchaseOrders.filter(o => o.status === "Partially Received").length;
    const received = purchaseOrders.filter(o => o.status === "Received").length;
    const totalVal = purchaseOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return { total, pending, partial, received, totalVal };
  }, [purchaseOrders]);

  // Selected supplier & store objects for checkout
  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || suppliers[0] || null;
  }, [suppliers, selectedSupplierId]);

  const selectedStore = useMemo(() => {
    return allStores.find(s => s.id === selectedStoreId) || allStores[0] || null;
  }, [allStores, selectedStoreId]);

  // Cart operations
  const updateQuantity = (productId: string, qty: number) => {
    const product = catalogItems.find(p => p.id === productId);
    if (!product) return;
    const sanitized = Math.max(0, Math.floor(qty));
    setCart(prev => {
      if (sanitized === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: sanitized };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Next PO Number generator
  const generatePONumber = () => {
    const count = purchaseOrders.length + 1;
    return `PO-2026-${String(count).padStart(4, "0")}`;
  };

  // Place Order handler
  const handlePlaceOrder = () => {
    if (isPlacingOrder) return;

    // Validations
    if (!selectedSupplier) {
      setToast("Please select a valid supplier from the Supplier Master.");
      return;
    }
    if (!selectedStore) {
      setToast("Please select a delivery store or warehouse.");
      return;
    }
    if (cartItems.length === 0) {
      setToast("Your cart is empty. Please add at least one product.");
      return;
    }
    if (cartItems.some(i => i.quantity <= 0)) {
      setToast("Please ensure all item quantities are greater than zero.");
      return;
    }
    if (!expectedDeliveryDate) {
      setToast("Please specify the expected delivery date.");
      return;
    }

    setIsPlacingOrder(true);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const poNumber = generatePONumber();

    const orderItems = cartItems.map(item => {
      const lineSub = item.rate * item.quantity;
      const lineGst = (lineSub * item.gst) / 100;
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        packSize: item.packSize,
        unit: item.unit,
        rate: item.rate,
        quantity: item.quantity,
        receivedQuantity: 0,
        gst: item.gst,
        gstAmount: lineGst,
        amount: lineSub + lineGst
      };
    });

    const newPO: RecordRow = {
      id: poNumber,
      poNumber,
      orderDate: formattedDate,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplier: {
        id: selectedSupplier.id,
        name: selectedSupplier.name,
        category: selectedSupplier.category || "Inputs",
        gstin: selectedSupplier.gstin || "21AABCU1234A1Z5",
        contactPerson: selectedSupplier.contactPerson || (selectedSupplier.contact ? selectedSupplier.contact.split(" · ")[0] : "Anil Mishra"),
        mobile: selectedSupplier.mobile || (selectedSupplier.contact ? selectedSupplier.contact.split(" · ")[1] : "06742550001"),
        address: selectedSupplier.address || "Industrial Area, Bhubaneswar, Odisha",
        paymentTerms: selectedSupplier.paymentTerms || 30
      },
      storeId: selectedStore.id,
      storeName: selectedStore.name,
      deliveryStore: {
        id: selectedStore.id,
        name: selectedStore.name,
        location: selectedStore.location,
        address: selectedStore.address,
        manager: selectedStore.manager,
        phone: selectedStore.phone
      },
      items: orderItems,
      subtotal: cartSubtotal,
      gstTotal: cartGstTotal,
      totalAmount: cartGrandTotal,
      expectedDeliveryDate,
      expectedDelivery: new Date(expectedDeliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      remarks: orderRemarks.trim() || "Delivery at specified warehouse unloading dock with test certification.",
      status: "Pending Delivery",
      receipts: [],
      createdBy: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role,
      createdAt: `${formattedDate} · ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      fpcId: "FPC-ODI-001"
    };

    // Update state: save PO, add audit, clear cart
    setState(prev => {
      const prevOrders = (prev.records?.purchaseOrders || prev.purchaseOrders || []) as RecordRow[];
      const updatedOrders = [newPO, ...prevOrders];
      return {
        ...prev,
        purchaseOrders: updatedOrders,
        records: {
          ...prev.records,
          purchaseOrders: updatedOrders
        },
        audit: [
          {
            id: `AUD-${Date.now()}`,
            actor: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role,
            role,
            module: "Services",
            record: poNumber,
            action: `created purchase order ${poNumber} for ${selectedSupplier.name} (${money(cartGrandTotal)})`,
            oldValue: "",
            newValue: JSON.stringify(newPO),
            date: formattedDate,
            fpcId: "FPC-ODI-001"
          },
          ...prev.audit
        ]
      };
    });

    // Clear cart and reset states
    setCart({});
    setIsPlacingOrder(false);
    setIsCheckout(false);
    setConfirmedPO(newPO);
    setToast(`Purchase Order ${poNumber} placed successfully.`);
  };

  // Open Receive Goods Modal
  const openReceiveModal = (po: RecordRow) => {
    setReceivingPO(po);
    const initialQty: Record<string, number> = {};
    (po.items || []).forEach((it: any) => {
      const remaining = Math.max(0, Number(it.quantity) - Number(it.receivedQuantity || 0));
      initialQty[it.id] = remaining; // default to remaining
    });
    setReceivingQuantities(initialQty);
    setChallanNumber(`DC-${Math.floor(10000 + Math.random() * 90000)}`);
    setReceivingNotes("");
  };

  // Confirm Goods Receipt & update inventory
  const handleConfirmGoodsReceipt = () => {
    if (!receivingPO) return;

    // Check if at least one item has quantity > 0
    let totalReceivingNow = 0;
    for (const it of receivingPO.items || []) {
      const receivingNow = receivingQuantities[it.id] || 0;
      if (receivingNow < 0) {
        setToast("Receiving quantity cannot be negative.");
        return;
      }
      const remaining = Math.max(0, Number(it.quantity) - Number(it.receivedQuantity || 0));
      if (receivingNow > remaining) {
        setToast(`Cannot receive more than remaining outstanding quantity (${remaining} ${it.unit}) for ${it.name}.`);
        return;
      }
      totalReceivingNow += receivingNow;
    }

    if (totalReceivingNow <= 0) {
      setToast("Please enter a valid receiving quantity greater than zero for at least one item.");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const grnId = `GRN-${Date.now()}`;

    // Calculate updated items and new status
    let allCompleted = true;
    const receivedItemsSummary: Array<{ id: string; name: string; quantityReceived: number; unit: string }> = [];

    const updatedItems = (receivingPO.items || []).map((it: any) => {
      const qtyReceiving = receivingQuantities[it.id] || 0;
      const newReceivedTotal = Number(it.receivedQuantity || 0) + qtyReceiving;
      if (newReceivedTotal < Number(it.quantity)) {
        allCompleted = false;
      }
      if (qtyReceiving > 0) {
        receivedItemsSummary.push({
          id: it.id,
          name: it.name,
          quantityReceived: qtyReceiving,
          unit: it.unit
        });
      }
      return {
        ...it,
        receivedQuantity: newReceivedTotal
      };
    });

    const newStatus = allCompleted ? "Received" : "Partially Received";

    const newReceiptEntry = {
      id: grnId,
      receivedDate: formattedDate,
      challanNumber: challanNumber.trim() || `DC-${Date.now().toString().slice(-5)}`,
      receivedBy: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role,
      notes: receivingNotes.trim() || "Inspected and stacked in delivery warehouse.",
      items: receivedItemsSummary
    };

    const updatedPO: RecordRow = {
      ...receivingPO,
      status: newStatus,
      items: updatedItems,
      receipts: [newReceiptEntry, ...(receivingPO.receipts || [])]
    };

    // Update state: PO, InputCatalog stock, and Inventory Event
    setState(prev => {
      // 1. Update purchase orders
      const prevOrders = (prev.records?.purchaseOrders || prev.purchaseOrders || []) as RecordRow[];
      const newOrders = prevOrders.map(o => (o.id === updatedPO.id ? updatedPO : o));

      // 2. Increase stock in inputCatalog for each received item
      const newCatalog = (prev.inputCatalog || []).map(product => {
        const receivedItem = receivedItemsSummary.find(r => r.id === product.id || r.name === product.name);
        if (receivedItem && receivedItem.quantityReceived > 0) {
          return {
            ...product,
            stock: Number(product.stock || 0) + receivedItem.quantityReceived
          };
        }
        return product;
      });

      // 3. Log Inventory Event
      const inventoryEvents = (prev.records?.inventoryEvents || []) as RecordRow[];
      const newEvents: RecordRow[] = receivedItemsSummary.map((r, idx) => ({
        id: `MOV-${grnId}-${idx}`,
        date: formattedDate,
        inventory: "Input",
        item: r.name,
        type: "Purchase in",
        voucher: updatedPO.poNumber || updatedPO.id,
        party: updatedPO.supplierName,
        quantityIn: r.quantityReceived,
        quantityOut: 0,
        unit: r.unit,
        status: "Posted",
        fpcId: "FPC-ODI-001"
      }));

      return {
        ...prev,
        purchaseOrders: newOrders,
        inputCatalog: newCatalog,
        records: {
          ...prev.records,
          purchaseOrders: newOrders,
          inventoryEvents: [...newEvents, ...inventoryEvents]
        },
        audit: [
          {
            id: `AUD-${Date.now()}`,
            actor: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role,
            role,
            module: "Services",
            record: updatedPO.poNumber,
            action: `goods receipt ${grnId} for ${updatedPO.poNumber} (${receivedItemsSummary.map(x => `${x.quantityReceived} ${x.unit} ${x.name}`).join(", ")})`,
            oldValue: receivingPO.status,
            newValue: newStatus,
            date: formattedDate,
            fpcId: "FPC-ODI-001"
          },
          ...prev.audit
        ]
      };
    });

    setReceivingPO(null);
    setToast(`Goods received successfully for ${updatedPO.poNumber}. Inventory has been updated.`);
  };

  // Cancel order handler
  const handleCancelOrder = (po: RecordRow) => {
    if (po.status === "Received") {
      setToast("Cannot cancel a completed purchase order.");
      return;
    }
    if (po.status === "Partially Received") {
      setToast("Cannot cancel an order where goods have already been partially received.");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to cancel Purchase Order ${po.poNumber}?`);
    if (!confirmed) return;

    setState(prev => {
      const prevOrders = (prev.records?.purchaseOrders || prev.purchaseOrders || []) as RecordRow[];
      const newOrders = prevOrders.map(o => (o.id === po.id ? { ...o, status: "Cancelled" } : o));
      return {
        ...prev,
        purchaseOrders: newOrders,
        records: {
          ...prev.records,
          purchaseOrders: newOrders
        }
      };
    });

    setToast(`Purchase Order ${po.poNumber} has been cancelled.`);
  };

  // Render Printable PO Document
  const renderPODocument = (po: RecordRow, isModal = true) => {
    const supplier = po.supplier || {};
    const store = po.deliveryStore || {};
    const items = (po.items || []) as any[];

    return (
      <div className="sm-po-document" id="printable-po-document">
        {/* Document Header */}
        <div className="sm-po-top">
          <div className="sm-po-fpc-info">
            <img src="/ual-baha-logo.png" alt="Company Logo" className="sm-po-logo" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b5e20", margin: "0 0 4px" }}>
                Green Valley Farmer Producer Company Ltd.
              </h2>
              <p style={{ fontSize: 11.5, color: "#4f6355", margin: 0, lineHeight: 1.4 }}>
                Registered Office: Plot No. 12, Industrial Estate, Keonjhar Sadar, Keonjhar, Odisha 758001<br />
                CIN: U01100OD2021PTC035612 | GSTIN: 21AAACG1234F1Z5 | PAN: AAACG1234F<br />
                Email: office@greenvalleyfpc.in | Tel: +91 9437004412
              </p>
            </div>
          </div>
          <div className="sm-po-meta">
            <span className="sm-po-doc-title">PURCHASE ORDER</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#223929" }}>
              PO No: <span style={{ fontFamily: "monospace" }}>{po.poNumber || po.id}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#5d7063" }}>Date: {po.orderDate}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`sm-status-chip ${(po.status || "Pending Delivery").toLowerCase().replace(" ", "-")}`}>
                <i /> {po.status || "Pending Delivery"}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier & Delivery Warehouse Details */}
        <div className="sm-po-parties-grid">
          <div className="sm-po-party-block">
            <small>VENDOR / SUPPLIER</small>
            <strong>{supplier.name || po.supplierName}</strong>
            <p>
              Supplier ID: {supplier.id || po.supplierId}<br />
              GSTIN: {supplier.gstin || "21AABCU1234A1Z5"}<br />
              Contact: {supplier.contactPerson || "Anil Mishra"} ({supplier.mobile || "9437002001"})<br />
              Address: {supplier.address || "Bhubaneswar, Odisha"}<br />
              Payment Terms: {supplier.paymentTerms ? `${supplier.paymentTerms} Days Net` : "30 Days Net"}
            </p>
          </div>
          <div className="sm-po-party-block">
            <small>DELIVERY DESTINATION / WAREHOUSE</small>
            <strong>{store.name || po.storeName}</strong>
            <p>
              Store ID: {store.id || po.storeId}<br />
              Address: {store.address || "Main Godown Campus, Keonjhar Sadar, Keonjhar, Odisha 758001"}<br />
              Store Manager: {store.manager || "Mamata Jena"} ({store.phone || "+91 9437004412"})<br />
              Expected Delivery Date: <strong style={{ color: "#1b5e20" }}>{po.expectedDelivery || po.expectedDeliveryDate}</strong>
            </p>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="sm-table-wrap">
          <table className="sm-table">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>Sl.</th>
                <th>Product Description</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Quantity</th>
                <th style={{ textAlign: "right" }}>Unit Rate</th>
                <th style={{ textAlign: "center" }}>GST %</th>
                <th style={{ textAlign: "right" }}>GST Amt</th>
                <th style={{ textAlign: "right" }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td style={{ textAlign: "center", color: "#697c6f" }}>{idx + 1}</td>
                  <td>
                    <strong style={{ color: "#1b3523" }}>{it.name}</strong>
                    {it.packSize && <div style={{ fontSize: 11, color: "#6d8173" }}>{it.packSize}</div>}
                  </td>
                  <td>
                    <span className="sm-category-tag">{it.category || "Input"}</span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {it.quantity} {it.unit}
                    {it.receivedQuantity !== undefined && (
                      <div style={{ fontSize: 10.5, color: it.receivedQuantity >= it.quantity ? "#1b5e20" : "#b26a00" }}>
                        Received: {it.receivedQuantity} {it.unit}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>{money(Number(it.rate))}</td>
                  <td style={{ textAlign: "center" }}>{it.gst || 0}%</td>
                  <td style={{ textAlign: "right", color: "#4f6556" }}>{money(Number(it.gstAmount || 0))}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#16441b" }}>{money(Number(it.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, alignItems: "start" }}>
          <div>
            <div className="sm-in-words-box">
              <small style={{ fontSize: 10.5, textTransform: "uppercase", fontWeight: 700, color: "#627868", display: "block", marginBottom: 2 }}>
                AMOUNT IN WORDS
              </small>
              <strong>{amountToWords(Number(po.totalAmount || 0))}</strong>
            </div>

            {po.remarks && (
              <div style={{ marginTop: 12, fontSize: 11.5, color: "#45594b", background: "#fafdfa", border: "1px solid #e1ece2", padding: "8px 12px", borderRadius: 6 }}>
                <strong>Remarks / Instructions:</strong> {po.remarks}
              </div>
            )}
          </div>

          <div style={{ background: "#f8fbf8", border: "1px solid #dce8df", borderRadius: 8, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#415747" }}>
              <span>Subtotal:</span>
              <strong>{money(Number(po.subtotal || 0))}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#415747" }}>
              <span>Applicable GST:</span>
              <strong>{money(Number(po.gstTotal || 0))}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#16441b", borderTop: "2px solid #1b5e20", paddingTop: 8, marginTop: 4 }}>
              <span>Grand Total:</span>
              <span>{money(Number(po.totalAmount || 0))}</span>
            </div>
          </div>
        </div>

        {/* Signatures & Terms */}
        <div className="sm-po-sign-row">
          <div style={{ fontSize: 10.5, color: "#677b6d", maxWidth: 400, lineHeight: 1.4 }}>
            <strong>Terms & Conditions:</strong><br />
            1. Goods must conform strictly to statutory FSSAI/Seed Act specifications.<br />
            2. Delivery Challan and Tax Invoice must accompany the consignment.<br />
            3. Final inventory inward is subject to quality and weighment verification at destination.
          </div>
          <div className="sm-po-sig-line">
            Authorized Signatory<br />
            <strong>Green Valley FPC Ltd.</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sm-root">
      {/* Module Header */}
      <header className="sm-header">
        <div>
          <span className="sm-eyebrow">Agri Business • Services & Input Procurement</span>
          <h1>Services · Purchase Orders & Store Supply</h1>
          <p>
            Procure high-quality seeds, fertilizers, and equipment from verified suppliers directly into FPC stores and warehouses.
          </p>
        </div>

        <div className="sm-header-actions">
          {activeTab === "orders" ? (
            <button
              type="button"
              className="sm-btn sm-btn-primary"
              onClick={() => {
                setActiveTab("catalog");
                setIsCheckout(false);
              }}
            >
              <Plus size={15} /> New Purchase Order
            </button>
          ) : (
            <button
              type="button"
              className="sm-btn sm-btn-secondary"
              onClick={() => setActiveTab("orders")}
            >
              <FileText size={15} /> View Purchase Orders ({purchaseOrders.length})
            </button>
          )}
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="sm-tabs-bar">
        <div className="sm-tabs">
          <button
            type="button"
            className={`sm-tab ${activeTab === "catalog" && !isCheckout ? "active" : ""}`}
            onClick={() => {
              setActiveTab("catalog");
              setIsCheckout(false);
            }}
          >
            <ShoppingBag size={15} /> Product Catalogue & Cart
            {cartItems.length > 0 && <span className="sm-tab-badge">{cartItems.length}</span>}
          </button>
          <button
            type="button"
            className={`sm-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <FileText size={15} /> Purchase Orders
            {orderMetrics.pending > 0 && <span className="sm-tab-badge amber">{orderMetrics.pending}</span>}
          </button>
          {isCheckout && activeTab === "catalog" && (
            <button
              type="button"
              className="sm-tab active"
            >
              <CheckCircle2 size={15} /> Checkout & Supplier Selection
            </button>
          )}
        </div>

        {activeTab === "catalog" && !isCheckout && (
          <div style={{ fontSize: 12, color: "#546e5c", fontWeight: 600 }}>
            {catalogItems.length} Products Available in Master Catalogue
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCT CATALOGUE & CART */}
      {activeTab === "catalog" && !isCheckout && (
        <div className="sm-catalog-layout">
          {/* Catalog Main Grid */}
          <div className="sm-catalog-main">
            {/* Toolbar */}
            <div className="sm-toolbar">
              <div className="sm-search-box">
                <Search size={16} color="#657b6c" />
                <input
                  type="text"
                  placeholder="Search seed, fertiliser, pesticide, equipment..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#8a9e90", padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="sm-chips">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`sm-chip ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="sm-product-grid">
              {filteredCatalog.map(product => {
                const inCartQty = cart[product.id] || 0;
                const isLow = Number(product.stock) <= Number(product.lowStock || 15);

                return (
                  <article key={product.id} className="sm-product-card">
                    <div>
                      <div className="sm-product-top">
                        <span className="sm-category-tag">{product.category || "General"}</span>
                        <span className={`sm-stock-tag ${isLow ? "low" : ""}`}>
                          {product.stock} {product.unit} available
                        </span>
                      </div>

                      <div className="sm-product-info" style={{ marginTop: 8 }}>
                        <h3>{product.name}</h3>
                        <p>{product.packSize || "Standard pack"} · {product.supplier || "Verified Supplier"}</p>
                        {product.batch && (
                          <div className="sm-product-meta">
                            <span>Batch: {product.batch}</span>
                            {product.expiry && <span>Exp: {product.expiry}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="sm-product-price-row">
                        <div className="sm-product-rate">
                          {money(Number(product.rate))}
                          <small> / {product.unit}</small>
                        </div>
                        <span className="sm-gst-badge">GST {product.gst ?? 5}%</span>
                      </div>

                      <div className="sm-product-controls" style={{ marginTop: 10 }}>
                        <div className="sm-stepper">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, inCartQty - 1)}
                            disabled={inCartQty <= 0}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={inCartQty || ""}
                            placeholder="0"
                            onChange={(e) => updateQuantity(product.id, Number(e.target.value) || 0)}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, inCartQty + 1)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {inCartQty === 0 ? (
                          <button
                            type="button"
                            className="sm-btn sm-btn-secondary sm-btn-compact"
                            onClick={() => updateQuantity(product.id, 1)}
                          >
                            <Plus size={13} /> Add
                          </button>
                        ) : (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1b5e20" }}>
                            {inCartQty} in cart
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: 10, border: "1px dashed #d5e2d7" }}>
                  <ShoppingBag size={28} color="#8da294" style={{ margin: "0 auto 8px" }} />
                  <h4 style={{ margin: "0 0 4px", color: "#223b2b" }}>No products match your search</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "#687c6f" }}>Try searching with another keyword or pick another category.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <aside className="sm-cart-panel">
            <div className="sm-cart-header">
              <h2>
                <ShoppingBag size={18} color="#1b5e20" /> Your Order Cart
              </h2>
              {cartItems.length > 0 && (
                <button type="button" className="sm-cart-clear" onClick={clearCart}>
                  Clear all
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="sm-cart-empty">
                <ShoppingBag size={32} color="#a1b8a8" style={{ margin: "0 auto 10px", display: "block" }} />
                <strong>Your cart is empty</strong>
                <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#778b7d" }}>
                  Select products from the catalog to build your purchase order.
                </p>
              </div>
            ) : (
              <>
                <div className="sm-cart-list">
                  {cartItems.map(item => {
                    const lineSub = item.rate * item.quantity;
                    const lineGst = (lineSub * item.gst) / 100;
                    const lineTotal = lineSub + lineGst;

                    return (
                      <div key={item.id} className="sm-cart-item">
                        <div className="sm-cart-item-top">
                          <span className="sm-cart-item-name">{item.name}</span>
                          <button
                            type="button"
                            className="sm-cart-item-remove"
                            onClick={() => updateQuantity(item.id, 0)}
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="sm-cart-item-rate">
                          {money(item.rate)} / {item.unit} · GST {item.gst}%
                        </div>

                        <div className="sm-cart-item-bottom">
                          <div className="sm-stepper">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 1)}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <span className="sm-cart-item-price">{money(lineTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="sm-cart-totals">
                  <div className="sm-cart-total-row">
                    <span>Total Items:</span>
                    <strong>{cartItems.length} lines ({totalCartQuantity} units)</strong>
                  </div>
                  <div className="sm-cart-total-row">
                    <span>Subtotal:</span>
                    <span>{money(cartSubtotal)}</span>
                  </div>
                  <div className="sm-cart-total-row">
                    <span>Applicable GST:</span>
                    <span>{money(cartGstTotal)}</span>
                  </div>
                  <div className="sm-cart-total-row grand">
                    <span>Grand Total:</span>
                    <span>{money(cartGrandTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="sm-btn sm-btn-primary"
                  style={{ width: "100%", padding: "10px 16px", marginTop: 4 }}
                  onClick={() => setIsCheckout(true)}
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {/* CHECKOUT WORKFLOW VIEW */}
      {activeTab === "catalog" && isCheckout && (
        <div className="sm-checkout-view">
          <div className="sm-checkout-nav">
            <button
              type="button"
              className="sm-btn sm-btn-secondary"
              onClick={() => setIsCheckout(false)}
            >
              <ArrowLeft size={15} /> Back to Cart & Products
            </button>

            <span style={{ fontSize: 13, fontWeight: 700, color: "#1b5e20" }}>
              Purchase Order Checkout · {cartItems.length} Items Selected
            </span>
          </div>

          {/* Section A: Supplier Selection */}
          <section className="sm-checkout-card">
            <div className="sm-card-head">
              <h2>
                <Building2 size={18} color="#1b5e20" /> 1. Supplier Selection (Mandatory)
              </h2>
              {selectedSupplier && (
                <span className="sm-status-chip received">
                  <Check size={11} /> Verified Supplier Selected
                </span>
              )}
            </div>

            <p style={{ fontSize: 12.5, color: "#566b5c", margin: 0 }}>
              Select the registered input supplier from your Supplier Master. All tax, contact and credit terms will be linked to the order.
            </p>

            {/* Searchable Supplier Dropdown */}
            <div className="sm-dropdown-wrap" ref={supplierDropdownRef}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="sm-dropdown-input"
                  placeholder="Search and select supplier by name, ID, category or GSTIN..."
                  value={supplierSearchQuery}
                  onFocus={() => setIsSupplierDropdownOpen(true)}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    setIsSupplierDropdownOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#698071" }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {isSupplierDropdownOpen && (
                <div className="sm-dropdown-menu">
                  {suppliers
                    .filter(s => {
                      const q = supplierSearchQuery.toLowerCase().trim();
                      return !q ||
                        s.name.toLowerCase().includes(q) ||
                        s.id.toLowerCase().includes(q) ||
                        (s.category && s.category.toLowerCase().includes(q)) ||
                        (s.gstin && s.gstin.toLowerCase().includes(q));
                    })
                    .map(s => (
                      <div
                        key={s.id}
                        className="sm-dropdown-option"
                        onClick={() => {
                          setSelectedSupplierId(s.id);
                          setSupplierSearchQuery(s.name);
                          setIsSupplierDropdownOpen(false);
                        }}
                      >
                        <div className="sm-dropdown-option-title">
                          <span>{s.name}</span>
                          <span className="sm-id-tag">{s.id}</span>
                        </div>
                        <div className="sm-dropdown-option-sub">
                          Category: {s.category || "General"} | GSTIN: {s.gstin || "21AABCU1234A1Z5"} | Contact: {s.contactPerson || s.contact || "Office"}
                        </div>
                      </div>
                    ))}
                  {suppliers.length === 0 && (
                    <div style={{ padding: "12px", fontSize: 12, color: "#778c7e", textAlign: "center" }}>
                      No suppliers registered in Supplier Master.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Supplier Highlight Card */}
            {selectedSupplier && (
              <div className="sm-selected-card">
                <div className="sm-selected-card-info">
                  <div className="sm-selected-title">
                    <Building2 size={18} color="#1b5e20" />
                    <span>{selectedSupplier.name}</span>
                    <span className="sm-id-tag">{selectedSupplier.id}</span>
                    <span className="sm-category-tag">{selectedSupplier.category || "Supplier"}</span>
                  </div>

                  <div className="sm-selected-grid">
                    <div className="sm-selected-grid-item">
                      <small>Contact Person</small>
                      <span>{selectedSupplier.contactPerson || (selectedSupplier.contact ? selectedSupplier.contact.split(" · ")[0] : "Anil Mishra")}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>Mobile / Phone</small>
                      <span>{selectedSupplier.mobile || (selectedSupplier.contact ? selectedSupplier.contact.split(" · ")[1] : "+91 9437002001")}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>GSTIN</small>
                      <span style={{ fontFamily: "monospace" }}>{selectedSupplier.gstin || "21AABCU1234A1Z5"}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>Registered Address</small>
                      <span>{selectedSupplier.address || "Bhubaneswar, Odisha"}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>Payment Terms</small>
                      <span>{selectedSupplier.paymentTerms ? `${selectedSupplier.paymentTerms} Days Net` : "30 Days Net"}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="sm-btn sm-btn-secondary sm-btn-compact"
                  onClick={() => setIsSupplierDropdownOpen(true)}
                >
                  Change
                </button>
              </div>
            )}
          </section>

          {/* Section B: Delivery Store Selection */}
          <section className="sm-checkout-card">
            <div className="sm-card-head">
              <h2>
                <Warehouse size={18} color="#1b5e20" /> 2. Delivery Store & Warehouse Destination (Mandatory)
              </h2>
              {selectedStore && (
                <span className="sm-status-chip received">
                  <Check size={11} /> Warehouse Confirmed
                </span>
              )}
            </div>

            <p style={{ fontSize: 12.5, color: "#566b5c", margin: 0 }}>
              Specify the receiving godown or store where the supplier will deliver this consignment.
            </p>

            {/* Searchable Store Dropdown */}
            <div className="sm-dropdown-wrap" ref={storeDropdownRef}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="sm-dropdown-input"
                  placeholder="Search and select receiving godown or input store..."
                  value={storeSearchQuery}
                  onFocus={() => setIsStoreDropdownOpen(true)}
                  onChange={(e) => {
                    setStoreSearchQuery(e.target.value);
                    setIsStoreDropdownOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#698071" }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {isStoreDropdownOpen && (
                <div className="sm-dropdown-menu">
                  {allStores
                    .filter(s => {
                      const q = storeSearchQuery.toLowerCase().trim();
                      return !q ||
                        s.name.toLowerCase().includes(q) ||
                        s.id.toLowerCase().includes(q) ||
                        s.location.toLowerCase().includes(q);
                    })
                    .map(s => (
                      <div
                        key={s.id}
                        className="sm-dropdown-option"
                        onClick={() => {
                          setSelectedStoreId(s.id);
                          setStoreSearchQuery(s.name);
                          setIsStoreDropdownOpen(false);
                        }}
                      >
                        <div className="sm-dropdown-option-title">
                          <span>{s.name}</span>
                          <span className="sm-id-tag">{s.id}</span>
                        </div>
                        <div className="sm-dropdown-option-sub">
                          Location: {s.location} | Manager: {s.manager} ({s.phone})
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Selected Store Highlight Card */}
            {selectedStore && (
              <div className="sm-selected-card">
                <div className="sm-selected-card-info">
                  <div className="sm-selected-title">
                    <Warehouse size={18} color="#1b5e20" />
                    <span>{selectedStore.name}</span>
                    <span className="sm-id-tag">{selectedStore.id}</span>
                  </div>

                  <div className="sm-selected-grid">
                    <div className="sm-selected-grid-item">
                      <small>Store Location</small>
                      <span>{selectedStore.location}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>Receiving Address</small>
                      <span>{selectedStore.address}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>Store Manager</small>
                      <span>{selectedStore.manager}</span>
                    </div>
                    <div className="sm-selected-grid-item">
                      <small>Contact Phone</small>
                      <span>{selectedStore.phone}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="sm-btn sm-btn-secondary sm-btn-compact"
                  onClick={() => setIsStoreDropdownOpen(true)}
                >
                  Change
                </button>
              </div>
            )}
          </section>

          {/* Section 3: Order Schedule & Remarks */}
          <section className="sm-checkout-card">
            <div className="sm-card-head">
              <h2>
                <Calendar size={18} color="#1b5e20" /> 3. Schedule & Order Details
              </h2>
              <span style={{ fontSize: 12, color: "#697f71", fontFamily: "monospace" }}>
                Auto PO Number: <strong>{generatePONumber()}</strong>
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#364e3f", display: "block", marginBottom: 4 }}>
                  Order Date
                </label>
                <input
                  type="text"
                  disabled
                  value={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cfe0d2", borderRadius: 6, background: "#f5f8f5", color: "#324939", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#364e3f", display: "block", marginBottom: 4 }}>
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={expectedDeliveryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cfe0d2", borderRadius: 6, background: "#ffffff", color: "#203628", fontSize: 13, outline: "none" }}
                />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#364e3f", display: "block", marginBottom: 4 }}>
                  Purchase Order Remarks & Delivery Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unloading at Bay A2. Vendor must provide manufacturer batch quality certificate."
                  value={orderRemarks}
                  onChange={(e) => setOrderRemarks(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cfe0d2", borderRadius: 6, background: "#ffffff", color: "#203628", fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Itemized Purchase Summary */}
          <section className="sm-checkout-card">
            <div className="sm-card-head">
              <h2>
                <ShoppingBag size={18} color="#1b5e20" /> 4. Ordered Products & Tax Summary
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1b5e20" }}>
                {cartItems.length} Products
              </span>
            </div>

            <div className="sm-table-wrap">
              <table className="sm-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>Sl.</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Ordered Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "center" }}>GST %</th>
                    <th style={{ textAlign: "right" }}>GST Amt</th>
                    <th style={{ textAlign: "right" }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, idx) => {
                    const lineSub = item.rate * item.quantity;
                    const lineGst = (lineSub * item.gst) / 100;
                    const lineTotal = lineSub + lineGst;

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", color: "#778b7d" }}>{idx + 1}</td>
                        <td>
                          <strong style={{ color: "#1c3523" }}>{item.name}</strong>
                          <div style={{ fontSize: 11, color: "#697d6e" }}>{item.packSize}</div>
                        </td>
                        <td>
                          <span className="sm-category-tag">{item.category}</span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {item.quantity} {item.unit}
                        </td>
                        <td style={{ textAlign: "right" }}>{money(item.rate)}</td>
                        <td style={{ textAlign: "center" }}>{item.gst}%</td>
                        <td style={{ textAlign: "right", color: "#4f6556" }}>{money(lineGst)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#16441b" }}>{money(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* In Words & Totals */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, alignItems: "center" }}>
              <div className="sm-in-words-box">
                <small style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "#697e6e", display: "block", marginBottom: 2 }}>
                  AMOUNT IN WORDS
                </small>
                <strong>{amountToWords(cartGrandTotal)}</strong>
              </div>

              <div style={{ background: "#f8fbf8", border: "1px solid #dce8df", borderRadius: 8, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#44594a" }}>
                  <span>Subtotal:</span>
                  <strong>{money(cartSubtotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#44594a" }}>
                  <span>Applicable GST:</span>
                  <strong>{money(cartGstTotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#16441b", borderTop: "2px solid #1b5e20", paddingTop: 8, marginTop: 4 }}>
                  <span>Grand Total:</span>
                  <span>{money(cartGrandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e7efe8", paddingTop: 16, marginTop: 8 }}>
              <button
                type="button"
                className="sm-btn sm-btn-secondary"
                onClick={() => setIsCheckout(false)}
              >
                <ArrowLeft size={15} /> Back to Cart
              </button>

              <button
                type="button"
                className="sm-btn sm-btn-primary"
                disabled={isPlacingOrder || !selectedSupplier || !selectedStore || cartItems.length === 0}
                onClick={handlePlaceOrder}
              >
                {isPlacingOrder ? "Placing Purchase Order..." : "Confirm & Place Purchase Order"} <CheckCircle2 size={16} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS HISTORY */}
      {activeTab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Order Metrics Strip */}
          <div className="sm-stats-strip">
            <div className="sm-stat-box">
              <small>TOTAL ORDERS</small>
              <strong>{orderMetrics.total}</strong>
              <span>All recorded POs</span>
            </div>
            <div className="sm-stat-box">
              <small>PENDING DELIVERY</small>
              <strong style={{ color: "#b26a00" }}>{orderMetrics.pending}</strong>
              <span>Awaiting supplier dispatch</span>
            </div>
            <div className="sm-stat-box">
              <small>PARTIALLY RECEIVED</small>
              <strong style={{ color: "#1a73e8" }}>{orderMetrics.partial}</strong>
              <span>Partial goods inwarded</span>
            </div>
            <div className="sm-stat-box">
              <small>COMPLETED / RECEIVED</small>
              <strong style={{ color: "#1b5e20" }}>{orderMetrics.received}</strong>
              <span>Fully received & stocked</span>
            </div>
            <div className="sm-stat-box">
              <small>TOTAL VALUE</small>
              <strong>{money(orderMetrics.totalVal)}</strong>
              <span>Cumulative procurement</span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="sm-toolbar" style={{ background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #dce8df" }}>
            <div className="sm-search-box">
              <Search size={16} color="#657b6c" />
              <input
                type="text"
                placeholder="Search by PO Number, Supplier, Store or Product..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
              {orderSearch && (
                <button
                  type="button"
                  onClick={() => setOrderSearch("")}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#8a9e90", padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm-chips">
              {["All", "Pending Delivery", "Partially Received", "Received", "Cancelled"].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`sm-chip ${orderStatusFilter === st ? "active" : ""}`}
                  onClick={() => setOrderStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="sm-table-wrap" style={{ background: "#fff" }}>
            <table className="sm-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>PO Number</th>
                  <th style={{ width: 100 }}>Order Date</th>
                  <th>Supplier</th>
                  <th>Delivery Store</th>
                  <th style={{ textAlign: "right", width: 110 }}>Total (₹)</th>
                  <th style={{ width: 110 }}>Expected Delivery</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ textAlign: "right", minWidth: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(po => {
                  const statusClass = (po.status || "Pending Delivery").toLowerCase().replace(" ", "-");
                  const canReceive = po.status === "Pending Delivery" || po.status === "Partially Received";
                  const canCancel = po.status === "Pending Delivery";

                  return (
                    <tr key={po.id}>
                      <td>
                        <strong style={{ fontFamily: "monospace", color: "#194121" }}>{po.poNumber || po.id}</strong>
                      </td>
                      <td style={{ color: "#4f6354" }}>{po.orderDate}</td>
                      <td>
                        <strong style={{ color: "#1b3523", display: "block" }}>{po.supplierName}</strong>
                        <span style={{ fontSize: 11, color: "#6e8273" }}>{po.supplierId}</span>
                      </td>
                      <td>
                        <div style={{ color: "#223b2b", fontWeight: 600 }}>{po.storeName}</div>
                        <span style={{ fontSize: 11, color: "#74887a" }}>{po.deliveryStore?.location || "Warehouse"}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#16441b" }}>
                        {money(Number(po.totalAmount))}
                      </td>
                      <td style={{ color: "#364e3e" }}>
                        {po.expectedDelivery || po.expectedDeliveryDate}
                      </td>
                      <td>
                        <span className={`sm-status-chip ${statusClass}`}>
                          <i /> {po.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="sm-btn sm-btn-secondary sm-btn-compact"
                            onClick={() => setViewingPO(po)}
                            title="View PO Document"
                          >
                            <FileText size={13} /> View
                          </button>

                          {canReceive && (
                            <button
                              type="button"
                              className="sm-btn sm-btn-primary sm-btn-compact"
                              onClick={() => openReceiveModal(po)}
                              title="Record Goods Receipt"
                            >
                              <PackageCheck size={13} /> Receive
                            </button>
                          )}

                          <button
                            type="button"
                            className="sm-btn sm-btn-secondary sm-btn-compact"
                            onClick={() => {
                              setViewingPO(po);
                              setTimeout(() => window.print(), 300);
                            }}
                            title="Print PO"
                          >
                            <Printer size={13} />
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              className="sm-btn sm-btn-outline-danger sm-btn-compact"
                              onClick={() => handleCancelOrder(po)}
                              title="Cancel PO"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#6f8274" }}>
                      <FileText size={28} color="#94a899" style={{ margin: "0 auto 8px", display: "block" }} />
                      No purchase orders found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION / VIEW PO MODAL */}
      {(confirmedPO || viewingPO) && (
        <div className="sm-modal-backdrop" onClick={() => { setConfirmedPO(null); setViewingPO(null); }}>
          <div className="sm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h2>
                {confirmedPO ? "Purchase Order Created Successfully" : `Purchase Order · ${(viewingPO?.poNumber || viewingPO?.id)}`}
              </h2>
              <button
                type="button"
                className="sm-modal-close"
                onClick={() => {
                  setConfirmedPO(null);
                  setViewingPO(null);
                  if (confirmedPO) setActiveTab("orders");
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sm-modal-body">
              {confirmedPO && (
                <div style={{ background: "#edf7ee", border: "1px solid #b7dfbc", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, color: "#1b5e20", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 size={18} color="#1b5e20" />
                  <span>
                    Purchase Order <strong>{confirmedPO.poNumber}</strong> has been created with status <em>Pending Delivery</em>. Inventory will be updated upon goods receipt.
                  </span>
                </div>
              )}

              {renderPODocument(confirmedPO || viewingPO!)}
            </div>

            <div className="sm-modal-footer">
              <button
                type="button"
                className="sm-btn sm-btn-secondary"
                onClick={() => {
                  const targetPO = confirmedPO || viewingPO!;
                  const content = `PURCHASE ORDER: ${targetPO.poNumber}\nDate: ${targetPO.orderDate}\nSupplier: ${targetPO.supplierName}\nDelivery Store: ${targetPO.storeName}\nTotal Amount: Rs ${targetPO.totalAmount}\nStatus: ${targetPO.status}`;
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${targetPO.poNumber}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setToast("Purchase Order document downloaded.");
                }}
              >
                <Download size={14} /> Download File
              </button>

              <button
                type="button"
                className="sm-btn sm-btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print Purchase Order
              </button>

              <button
                type="button"
                className="sm-btn sm-btn-secondary"
                onClick={() => {
                  setConfirmedPO(null);
                  setViewingPO(null);
                  if (confirmedPO) setActiveTab("orders");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOODS RECEIPT / INVENTORY INWARD MODAL */}
      {receivingPO && (
        <div className="sm-modal-backdrop" onClick={() => setReceivingPO(null)}>
          <div className="sm-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="sm-modal-header">
              <h2>
                <PackageCheck size={18} color="#1b5e20" /> Receive Goods & Inward Stock · {receivingPO.poNumber}
              </h2>
              <button type="button" className="sm-modal-close" onClick={() => setReceivingPO(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="sm-modal-body">
              {/* Context Summary Banner */}
              <div style={{ background: "#f5f9f5", border: "1px solid #d7e6da", borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                <div>
                  <small style={{ color: "#637869", textTransform: "uppercase", fontSize: 10, fontWeight: 700, display: "block" }}>SUPPLIER</small>
                  <strong style={{ color: "#193522", fontSize: 13 }}>{receivingPO.supplierName}</strong>
                </div>
                <div>
                  <small style={{ color: "#637869", textTransform: "uppercase", fontSize: 10, fontWeight: 700, display: "block" }}>DELIVERY WAREHOUSE</small>
                  <strong style={{ color: "#193522", fontSize: 13 }}>{receivingPO.storeName}</strong>
                </div>
              </div>

              {/* Receipt Parameters Form */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#364e3f", display: "block", marginBottom: 4 }}>
                    Delivery Challan / Invoice No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={challanNumber}
                    placeholder="e.g. DC-98412"
                    onChange={(e) => setChallanNumber(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cfe0d2", borderRadius: 6, fontSize: 13, outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#364e3f", display: "block", marginBottom: 4 }}>
                    Receiving Officer
                  </label>
                  <input
                    type="text"
                    disabled
                    value={role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cfe0d2", borderRadius: 6, background: "#f5f8f5", color: "#324939", fontSize: 13 }}
                  />
                </div>

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#364e3f", display: "block", marginBottom: 4 }}>
                    Warehouse Bay / Inspection Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={receivingNotes}
                    placeholder="e.g. Inspected and stacked in Bay A2. Bags intact."
                    onChange={(e) => setReceivingNotes(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cfe0d2", borderRadius: 6, fontSize: 13, outline: "none" }}
                  />
                </div>
              </div>

              {/* Line Items Receiving Table */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#1e3727" }}>
                    Item Quantities to Inward into Inventory
                  </label>
                  <button
                    type="button"
                    style={{ border: "none", background: "none", color: "#1b5e20", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}
                    onClick={() => {
                      const allMax: Record<string, number> = {};
                      (receivingPO.items || []).forEach((it: any) => {
                        allMax[it.id] = Math.max(0, Number(it.quantity) - Number(it.receivedQuantity || 0));
                      });
                      setReceivingQuantities(allMax);
                    }}
                  >
                    Receive All Remaining Outstanding
                  </button>
                </div>

                <div className="sm-table-wrap">
                  <table className="sm-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th style={{ textAlign: "right", width: 90 }}>Ordered</th>
                        <th style={{ textAlign: "right", width: 90 }}>Received</th>
                        <th style={{ textAlign: "right", width: 90 }}>Remaining</th>
                        <th style={{ textAlign: "right", width: 140 }}>Receiving Now *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(receivingPO.items || []).map((it: any) => {
                        const remaining = Math.max(0, Number(it.quantity) - Number(it.receivedQuantity || 0));
                        const currentReceiving = receivingQuantities[it.id] ?? 0;

                        return (
                          <tr key={it.id}>
                            <td>
                              <strong style={{ color: "#193522" }}>{it.name}</strong>
                              <div style={{ fontSize: 11, color: "#697e6f" }}>{it.packSize}</div>
                            </td>
                            <td style={{ textAlign: "right" }}>{it.quantity} {it.unit}</td>
                            <td style={{ textAlign: "right", color: "#1b5e20", fontWeight: 600 }}>
                              {it.receivedQuantity || 0} {it.unit}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: remaining > 0 ? "#b26a00" : "#1b5e20" }}>
                              {remaining} {it.unit}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={remaining}
                                  value={currentReceiving}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setReceivingQuantities(prev => ({
                                      ...prev,
                                      [it.id]: Math.min(remaining, Math.max(0, val))
                                    }));
                                  }}
                                  style={{
                                    width: 70,
                                    padding: "6px 8px",
                                    border: "1px solid #b7cfbb",
                                    borderRadius: 6,
                                    textAlign: "right",
                                    fontWeight: 700,
                                    color: "#16441b",
                                    outline: "none"
                                  }}
                                />
                                <span style={{ fontSize: 11, color: "#54685a" }}>{it.unit}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 10, fontSize: 11.5, color: "#5b7364", background: "#f2f7f3", padding: "8px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} color="#1b5e20" />
                  <span>
                    Confirming receipt will immediately update warehouse input stock and log an Inward Inventory Event.
                  </span>
                </div>
              </div>
            </div>

            <div className="sm-modal-footer">
              <button
                type="button"
                className="sm-btn sm-btn-secondary"
                onClick={() => setReceivingPO(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sm-btn sm-btn-primary"
                onClick={handleConfirmGoodsReceipt}
              >
                Confirm Goods Receipt & Update Inventory <PackageCheck size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

