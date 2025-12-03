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

  const handlePlay = () => {
    if (!username.trim()) {
      alert("🌱 Đừng quên nhập tên nhé!");
      return;
    }
    const selectedSkin = SKINS[skinIndex].id;
    router.push(
      `/game?username=${encodeURIComponent(username)}&skin=${selectedSkin}`
    );
  };

  const nextSkin = () => {
    setSkinIndex((prev) => (prev + 1) % SKINS.length);
  };

  const prevSkin = () => {
    setSkinIndex((prev) => (prev - 1 + SKINS.length) % SKINS.length);
  };

  const currentSkin = SKINS[skinIndex];
return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap");
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          overflow: hidden;
        }

        @keyframes float-bg {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes popIn {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes tank-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
