"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SKINS = [
  { id: "red", name: "Đỏ", img: "/skins/red.png" },
  { id: "mint", name: "Đỏ", img: "/skins/mint.png" },
  { id: "ocean", name: "Đại Dương", img: "/skins/ocean.png" },
  { id: "lemon", name: "Chanh Tươi", img: "/skins/lemon.png" },
  { id: "dark", name: "Bóng Đêm", img: "/skins/dark.png" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [activeMenu, setActiveMenu] = useState<"settings" | "keyboard" | null>(
    null
  );
  const [volume, setVolume] = useState(50);
  const [skinIndex, setSkinIndex] = useState(0);
  const router = useRouter(); 
