"use client";

import {
  BaseSelection,
  Descendant,
  Editor,
  NodeEntry,
  Range,
  Text,
  Transforms,
  createEditor,
} from "slate";
import { Doc, XmlText } from "yjs";
import LiveblocksProvider from "@liveblocks/yjs";
import { useCreateThread, useRoom, useThreads } from "@/liveblocks.config";
import {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";
import { withYHistory, withYjs } from "@slate-yjs/core";
import { Composer, Thread } from "@liveblocks/react-comments";
import { ComposerSubmitComment } from "@liveblocks/react-comments/primitives";

const doc = new Doc();
const text = doc.get("slate-comments-v1", XmlText) as XmlText;

export default function SlateEditorContainer() {
  const room = useRoom();
  const provider = useMemo(() => {
    return new LiveblocksProvider(room, doc);
  }, [room]);

  useEffect(() => {
    provider.connect();
    return () => {
      provider.disconnect();
    };
  }, [provider]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      provider.on("sync", onStoreChange);
      return () => provider.off("sync", onStoreChange);
    },
    [provider]
  );

  const getSnapshot = useCallback(() => {
    return provider.synced;
  }, [provider]);

  const isConnected = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!isConnected) return <div>Loading...</div>;

  return <SlateEditor />;
}

function SlateEditor() {
  const editor = useMemo(() => {
    return withYHistory(
      withYjs(withNormalization(withReact(createEditor())), text)
    );
  }, []);

  const [threadSelection, setThreadSelection] = useState<BaseSelection>();
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const { threads } = useThreads();
  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  const _createThread = useCreateThread();

  useEffect(() => {
    editor.connect();
    return () => {
      editor.disconnect();
    };
  }, [editor]);

  const handleValueChange = (value: Descendant[]) => {
    setThreadSelection(undefined);
  };

  const handleRenderElement = ({
    children,
    attributes,
    element,
  }: RenderElementProps) => {
    switch (element.type) {
      default:
        return <div {...attributes}>{children}</div>;
    }
  };

  const handleRenderLeaf = ({
    children,
    attributes,
    leaf,
  }: RenderLeafProps) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.highlighted) {
      children = <span className="bg-blue-200">{children}</span>;
    }

    const threads = Object.keys(leaf).filter((key) => key.startsWith("th_"));

    if (threads.length > 0) {
      children = (
        <span
          className="bg-yellow-200"
          onClick={() => {
            setActiveThreadId(threads[0]);
          }}
        >
          {children}
        </span>
      );
    }

    return <span {...attributes}>{children}</span>;
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {};

  const handleDecorate = ([node, path]: NodeEntry) => {
    if (!threadSelection) return [];

    if (!Range.includes(threadSelection, path)) return [];

    return [
      {
        anchor: threadSelection.anchor,
        focus: threadSelection.focus,
        highlighted: true,
      },
    ];
  };

  const createThread = (comment: ComposerSubmitComment) => {
    const thread = _createThread({ body: comment.body });
    Editor.addMark(editor, thread.id, true);
    setActiveThreadId(thread.id);
  };

  return (
    <div className="flex flex-col gap-2 m-4 text-sm">
      <Slate editor={editor} initialValue={[]} onChange={handleValueChange}>
        <div className="flex gap-2">
          <button
            className="items-center justify-center border border-gray-300 rounded-md px-2 py-1"
            onPointerDown={(event) => {
              event.preventDefault();

              const isActive = isMarkActive(editor, "bold");
              if (isActive) {
                Editor.removeMark(editor, "bold");
              } else {
                Editor.addMark(editor, "bold", true);
              }
            }}
          >
            Bold
          </button>

          <button
            className="items-center justify-center border border-gray-300 rounded-md px-2 py-1"
            onPointerDown={(e) => {
              e.preventDefault();
              setThreadSelection(editor.selection);
            }}
          >
            Add comment
          </button>
        </div>

        <div className="flex gap-2 justify-between">
          <Editable
            autoFocus
            renderElement={handleRenderElement}
            renderLeaf={handleRenderLeaf}
            onKeyDown={handleKeyDown}
            decorate={handleDecorate}
            className="p-4 outline-none border border-gray-300 rounded-sm w-2/3"
          />

          <div className="w-1/3 mx-auto">
            {threadSelection ? (
              <Composer
                onComposerSubmit={({ body }, event) => {
                  event.preventDefault();
                  createThread({ body });
                }}
                className="border border-gray-300 rounded-sm"
              />
            ) : activeThread ? (
              <Thread thread={activeThread} />
            ) : (
              <div>No threads selected</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {threads.map((thread) => {
            return <Thread key={thread.id} thread={thread} />;
          })}
        </div>
      </Slate>
    </div>
  );
}

function isMarkActive(editor: Editor, format: keyof Omit<Text, "text">) {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
}

function withNormalization(editor: Editor) {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node] = entry;
    if (!Editor.isEditor(node) || node.children.length > 0) {
      return normalizeNode(entry);
    }

    Transforms.insertNodes(
      editor,
      {
        type: "paragraph",
        children: [{ text: "" }],
      },
      { at: [0] }
    );
  };
  return editor;
}
