
import Image from "next/image";
import { redirect } from "next/navigation";
import GameHome from "../View/GameHome";
import { io } from "socket.io-client";
import GameClient from "../View/GameClient";

export default function Home() {
 
  return ( 
        <GameHome />
    );
}
