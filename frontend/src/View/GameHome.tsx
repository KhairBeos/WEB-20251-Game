"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StyleMap = { [key: string]: any };

const SKINS = [
  { id: "red", name: "Đỏ", img: "/skins/red.png" }, 
  { id: "mint", name: "Bạc Hà", img: "/skins/mint.png" },
  { id: "ocean", name: "Đại Dương", img: "/skins/ocean.png" },
  { id: "lemon", name: "Chanh Tươi", img: "/skins/lemon.png" },
  { id: "dark", name: "Bóng Đêm", img: "/skins/dark.png" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeMenu, setActiveMenu] = useState<"settings" | "keyboard" | null>(null);
  const [volume, setVolume] = useState(50);
  const [skinIndex, setSkinIndex] = useState(0);
  const router = useRouter();

  const handlePlay = async () => {
    if (!username.trim()) {
      alert("🌱 Đừng quên nhập tên nhé chiến binh!");
      return;
    }
    const selectedSkin = SKINS[skinIndex].id;

    // Gọi Login API để lây sessionId
    const res = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      alert("❌ Đăng nhập thất bại! Vui lòng kiểm tra tên và mật khẩu.");
      return;
    }
    const data = await res.json();
    const sessionId = data.sessionId;
    // Lưu sessionId vào localStorage
    localStorage.setItem('tank_session_id', sessionId);

    // chuyển trang
    router.push(
      `/game?username=${encodeURIComponent(username)}&skin=${selectedSkin}`
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePlay();
    }
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
        * { box-sizing: border-box; }
        body { margin: 0; overflow: hidden; }

        @keyframes float-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tank-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      <div style={styles.container}>
        <div style={{...styles.circle, top: "-10%", left: "-10%", width: "500px", height: "500px", background: "rgba(255,255,255,0.2)"}}></div>
        <div style={{...styles.circle, bottom: "-10%", right: "-5%", width: "400px", height: "400px", background: "#ff9a9e", opacity: 0.2}}></div>

        <div style={styles.card}>
          <div style={styles.logoBadge}>IO</div>
          <h1 style={styles.title}>
            Tank<span style={{ color: "#4facfe" }}>Battle</span>
          </h1>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={styles.skinSelector}>
              <button onClick={prevSkin} style={styles.arrowBtn}>❮</button>

              <div style={styles.skinPreview}>
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

              <button onClick={nextSkin} style={styles.arrowBtn}>❯</button>
            </div>

            <input
              type="text"
              placeholder="Nhập tên chiến binh..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown} 
              style={styles.input}
              autoFocus 
            />
            <input 
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
            />
            <button
              onClick={handlePlay}
              style={styles.playButton}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              VÀO GAME NGAY 🚀
            </button>
          </div>
        </div>

        <div style={styles.menuContainer}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setActiveMenu(activeMenu === "settings" ? null : "settings")}
              style={styles.iconButton(activeMenu === "settings")}
            >
              ⚙️ Cài đặt
            </button>
            {activeMenu === "settings" && (
              <div style={styles.popup}>
                <h4 style={styles.popupTitle}>Âm lượng</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              onClick={() => setActiveMenu(activeMenu === "keyboard" ? null : "keyboard")}
              style={styles.iconButton(activeMenu === "keyboard")}
            >
              ⌨️ Điều khiển
            </button>
            {activeMenu === "keyboard" && (
              <div style={styles.popup}>
                <h4 style={styles.popupTitle}>Di chuyển</h4>
                <div style={styles.keyGrid}>
                  <div style={{ gridColumn: "2", display: "flex", justifyContent: "center" }}>
                    <KeyCap label="W" />
                  </div>
                  <div style={{ gridColumn: "1/4", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <KeyCap label="A" />
                    <KeyCap label="S" />
                    <KeyCap label="D" />
                  </div>
                </div>
                <h4 style={styles.popupTitle}>Bắn</h4>
                 <div style={{ gridColumn: "2", display: "flex", justifyContent: "center" }}>
                    <KeyCap label="J" />
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

const styles: StyleMap = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    background: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
    backgroundSize: "200% 200%",
    animation: "float-bg 10s ease infinite",
    fontFamily: "'Nunito', sans-serif",
    position: "relative",
    color: "#444",
  },
  circle: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 1,
  },
  card: {
    background: "rgba(255, 255, 255, 0.9)",
    padding: "3rem 2.5rem",
    borderRadius: "32px",
    boxShadow: "0 20px 60px rgba(0, 50, 100, 0.15), inset 0 -5px 10px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
    width: "380px",
    zIndex: 10,
    position: "relative",
    animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  logoBadge: {
    position: "absolute",
    top: "-20px",
    background: "#ff9a9e",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "900",
    boxShadow: "0 8px 20px rgba(255, 154, 158, 0.5)",
    transform: "rotate(-5deg)",
  },
  title: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: "2.8rem",
    margin: 0,
    color: "#444",
    fontWeight: 900,
    letterSpacing: "-1px",
  },
  input: {
    width: "100%",
    padding: "0.8rem 1.2rem",
    fontSize: "1rem",
    background: "#f0f4f8",
    border: "2px solid transparent",
    borderRadius: "16px",
    color: "#555",
    textAlign: "center",
    outline: "none",
    transition: "0.3s",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: "bold",
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.05)",
  },
  skinSelector: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
    padding: "10px",
    borderRadius: "20px",
    boxShadow: "inset 0 0 0 2px #f0f4f8",
    width: "100%",
  },
  arrowBtn: {
    background: "transparent",
    border: "none",
    fontSize: "1.5rem",
    color: "#ccc",
    cursor: "pointer",
    padding: "0 10px",
    transition: "0.2s",
  },
  skinPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    width: "120px",
  },
  skinName: { fontSize: "0.9rem", fontWeight: "bold", color: "#888" },
  tankContainer: {
    position: "relative",
    width: "80px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    animation: "tank-bounce 2s infinite ease-in-out",
  },
  playButton: {
    width: "100%",
    padding: "1rem",
    fontSize: "1.2rem",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: "900",
    color: "white",
    background: "linear-gradient(to right, #ff758c 0%, #ff7eb3 100%)",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 10px 25px rgba(255, 117, 140, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: "30px",
    right: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    alignItems: "flex-end",
    zIndex: 20,
  },
  iconButton: (active: boolean) => ({
    padding: "0.8rem 1.5rem",
    borderRadius: "20px",
    border: "none",
    background: active ? "#fff" : "rgba(255,255,255,0.6)",
    color: active ? "#4facfe" : "#555",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: active
      ? "0 5px 15px rgba(79, 172, 254, 0.3)"
      : "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    gap: "8px",
    minWidth: "140px",
    justifyContent: "center",
  }),
  popup: {
    position: "absolute",
    right: "160px",
    top: "0",
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "24px",
    width: "240px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.1)",
    animation: "popIn 0.2s ease-out",
  },
  popupTitle: {
    margin: "0 0 1rem 0",
    fontSize: "1rem",
    color: "#888",
    borderBottom: "2px solid #f0f4f8",
    paddingBottom: "0.5rem",
  },
  rangeInput: { width: "100%", cursor: "pointer", accentColor: "#4facfe" },
  keyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "0.6rem",
  },
  keyCap: {
    width: "45px",
    height: "45px",
    background: "#fff",
    borderBottom: "4px solid #e0e0e0",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    boxShadow: "0 5px 10px rgba(0,0,0,0.05)",
    color: "#444",
  },
};