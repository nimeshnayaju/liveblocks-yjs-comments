"use client";

import { RoomProvider } from "@/liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import SlateEditorContainer from "./editor";
export default function Home() {
  return (
    <RoomProvider id="slate-comments-v1" initialPresence={{}}>
      <ClientSideSuspense fallback={<div>Loading...</div>}>
        {() => <SlateEditorContainer />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
