"use client";

import type { IconType } from "react-icons";

import type { DbIconComponent } from "@/components/runtime/databases/types/engine-definition";

export function iconFromReactIcons(Icon: IconType): DbIconComponent {
  // react-icons uses a broader prop type than our UI needs; this keeps call-sites clean.
  return Icon as unknown as DbIconComponent;
}
