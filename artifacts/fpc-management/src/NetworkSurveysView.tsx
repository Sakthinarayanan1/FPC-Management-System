import React from "react";
import type { Role } from "@/lib/config";
import type { RecordRow, State } from "@/lib/store";
import BaselineSurveysModule from "./BaselineSurveysModule";

interface Props {
  state: State;
  setState?: React.Dispatch<React.SetStateAction<State>>;
  role: Role;
  setToast: (msg: string) => void;
  go: (dest: string) => void;
  onOpenFpc?: (fpc: RecordRow) => void;
}

export default function NetworkSurveysView({
  state,
  setState,
  role,
  setToast,
  go,
  onOpenFpc
}: Props) {
  return (
    <div className="network-surveys-shell">
      <BaselineSurveysModule
        state={state}
        setState={setState || (() => {})}
        role={role}
        setToast={setToast}
        go={go}
      />
    </div>
  );
}
