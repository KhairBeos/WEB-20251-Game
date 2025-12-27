"use client";
import { useToastContext } from "../Component/ToastProvider";

export const useToast = () => {
  const ctx = useToastContext();
  return ctx?.addToast;
};
