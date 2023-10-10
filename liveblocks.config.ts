import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import LiveblocksProvider from "@liveblocks/yjs";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {};

type Storage = {};

// Optionally, UserMeta represents static/readonly metadata on each User, as
// provided by your own custom auth backend (if used). Useful for data that
// will not change during a session, like a User's name or avatar.
type UserMeta = {
  id: string; // Accessible through `user.id`
  info: {
    name: string;
    picture: string;
    color: string;
  }; // Accessible through `user.info`
};

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useOthers,
    useSelf,
    useThreads,
    useCreateThread,
    useCreateComment,
    useEditComment,
    useAddReaction,
    useDeleteComment,
    useEditThreadMetadata,
  },
} = createRoomContext<Presence, Storage, UserMeta /*, RoomEvent */>(client);

export type LiveblocksProviderType = LiveblocksProvider<
  Presence,
  Storage,
  UserMeta,
  {}
>;
