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
      }</style>

      <div style={styles.container}>
        <div
          style={{
            ...styles.circle,
            top: "-10%",
            left: "-10%",
            width: "500px",
            height: "500px",
            background: "rgba(255,255,255,0.2)",
          }}
        ></div>
        <div
          style={{
            ...styles.circle,
            bottom: "-10%",
            right: "-5%",
            width: "400px",
            height: "400px",
            background: "#ff9a9e",
            opacity: 0.2,
          }}
        ></div>

        <div style={styles.card}>
          <div style={styles.logoBadge}>IO</div>
          <h1 style={styles.title}>
            Tank<span style={{ color: "#4facfe" }}>Battle</span>
          </h1>

          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="Nhập tên chiến binh..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />

            <div style={styles.skinSelector}>
              <button onClick={prevSkin} style={styles.arrowBtn}>
                ❮
              </button>

              <div style={styles.skinPreview}>
                {/* --- CHỈNH SỬA 2: Thay thế CSS Tank bằng thẻ IMG --- */}
                <div style={styles.tankContainer}>
                  <img
                    src={currentSkin.img}
                    alt={currentSkin.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.3))",
                    }}
                  />
                </div>

                <span style={styles.skinName}>{currentSkin.name}</span>
              </div>

              <button onClick={nextSkin} style={styles.arrowBtn}>
                ❯
              </button>
            </div>

            <button
              onClick={handlePlay}
              style={styles.playButton}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-3px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
    VÀO GAME NGAY 🚀
            </button>
          </div>
        </div>

        <div style={styles.menuContainer}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() =>
                setActiveMenu(activeMenu === "settings" ? null : "settings")
              }
              style={styles.iconButton(activeMenu === "settings")}
            >
              ⚙️ Cài đặt
            </button>
      {activeMenu === "settings" && (
              <div style={styles.popup}>
                <h4 style={styles.popupTitle}>Âm lượng</h4>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span>🔊</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() =>
                setActiveMenu(activeMenu === "keyboard" ? null : "keyboard")
              }
              style={styles.iconButton(activeMenu === "keyboard")}
            >
              ⌨️ Điều khiển
            </button>
            {activeMenu === "keyboard" && (
              <div style={styles.popup}>
                <h4 style={styles.popupTitle}>Bàn phím</h4>
                <div style={styles.keyGrid}>
                  <div
                    style={{
                      gridColumn: "2",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <KeyCap label="W" />
                  </div>
                  <div
                    style={{
                      gridColumn: "1/4",
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "center",
                    }}
                  >
                    <KeyCap label="A" />
                    <KeyCap label="S" />
                    <KeyCap label="D" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const KeyCap = ({ label }: { label: string }) => (
  <div style={styles.keyCap}>{label}</div>
);