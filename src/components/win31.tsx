"use client";

import type { ReactNode } from "react";

/**
 * The Windows 3.1 widgets the game is framed in.
 *
 * SkiFree was an .exe in a plain window with a menu bar, and running it inside
 * one does more for the period feel than any amount of work on the snow. These
 * are deliberately dumb presentational pieces — all the bevels live here so the
 * game component is not drowning in border utilities.
 */

/** Raised bevel: light on the top and left, dark on the bottom and right. */
export const RAISED =
  "border-2 border-t-white border-l-white border-r-[#4a4a4a] border-b-[#4a4a4a]";

/** Sunken bevel — the same thing inverted, for anything recessed. */
export const SUNKEN =
  "border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white";

/** A thin raised edge, for menu items and small buttons. */
export const RAISED_THIN =
  "border border-t-white border-l-white border-r-[#808080] border-b-[#808080]";

export function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex select-none items-center gap-1 bg-[#000080] px-0.5 py-0.5">
      <ControlBox>
        <span className="block h-[3px] w-3 bg-black" />
      </ControlBox>
      <span className="flex-1 truncate px-1 text-center text-sm font-bold tracking-wide text-white">
        {title}
      </span>
      <ControlBox>
        <span className="block h-[3px] w-2.5 self-end bg-black" />
      </ControlBox>
      <ControlBox>
        <span className="block h-2 w-2.5 border-t-2 border-black" />
      </ControlBox>
    </div>
  );
}

function ControlBox({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={`flex h-4 w-5 shrink-0 items-center justify-center bg-[#c0c0c0] ${RAISED_THIN}`}
    >
      {children}
    </span>
  );
}

export type MenuItem =
  | { kind: "separator" }
  | {
      kind: "item";
      label: string;
      /** Right-aligned shortcut hint, e.g. "F2". */
      hint?: string;
      /** Renders a tick to the left of the label. */
      checked?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    };

export type Menu = {
  id: string;
  label: string;
  /** The letter Windows would underline. Must appear in `label`. */
  access: string;
  items: MenuItem[];
};

export function MenuBar({
  menus,
  openId,
  onOpen,
  onClose,
}: {
  menus: Menu[];
  openId: string | null;
  onOpen: (id: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="relative flex select-none items-stretch gap-0 bg-[#c0c0c0] px-1 py-0.5 text-sm">
      {openId !== null ? (
        // Click-away backdrop. Sits under the dropdown but over the slope, so a
        // stray click dismisses the menu instead of making the skier jump.
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 cursor-default"
          onPointerDown={onClose}
        />
      ) : null}
      {menus.map((menu) => {
        const open = openId === menu.id;
        return (
          <div key={menu.id} className="relative z-30">
            <button
              type="button"
              // Hovering an already-open bar walks between menus, which is what
              // every menu bar of the era did.
              onPointerEnter={() => openId !== null && onOpen(menu.id)}
              onClick={() => onOpen(open ? null : menu.id)}
              className={`px-2 py-0.5 text-black ${
                open
                  ? "bg-[#000080] text-white"
                  : "hover:bg-[#000080] hover:text-white"
              }`}
            >
              <AccessLabel label={menu.label} access={menu.access} />
            </button>
            {open ? <Dropdown items={menu.items} onClose={onClose} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function AccessLabel({ label, access }: { label: string; access: string }) {
  const index = label.indexOf(access);
  if (index < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, index)}
      <span className="underline">{label[index]}</span>
      {label.slice(index + 1)}
    </>
  );
}

/**
 * Gives every row a stable key without falling back to the array index.
 * Separators have no identity of their own, so they borrow the label of the item
 * above them — which is stable as long as the menu above them is.
 */
function withKeys(items: MenuItem[]): Array<{ key: string; item: MenuItem }> {
  let previousLabel = "top";
  return items.map((item) => {
    if (item.kind === "separator")
      return { key: `after-${previousLabel}`, item };
    previousLabel = item.label;
    return { key: item.label, item };
  });
}

function Dropdown({
  items,
  onClose,
}: {
  items: MenuItem[];
  onClose: () => void;
}) {
  return (
    <div
      className={`absolute left-0 top-full z-30 min-w-52 bg-[#c0c0c0] py-0.5 shadow-[2px_2px_0_rgba(0,0,0,0.45)] ${RAISED}`}
    >
      {withKeys(items).map(({ key, item }) =>
        item.kind === "separator" ? (
          <div
            key={key}
            className="my-0.5 border-t border-t-[#808080] border-b border-b-white"
          />
        ) : (
          <button
            key={key}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className="flex w-full items-center gap-3 px-2 py-[3px] text-left text-black enabled:hover:bg-[#000080] enabled:hover:text-white disabled:text-[#808080]"
          >
            <span className="w-3 shrink-0">{item.checked ? "✓" : ""}</span>
            <span className="flex-1">{item.label}</span>
            {item.hint ? (
              <span className="shrink-0 opacity-70">{item.hint}</span>
            ) : null}
          </button>
        ),
      )}
    </div>
  );
}

export function StatusBar({ children }: { children: ReactNode }) {
  return (
    <div className={`bg-[#c0c0c0] px-2 py-1 text-xs text-black ${SUNKEN}`}>
      {children}
    </div>
  );
}

/** A modal panel drawn over the slope, styled as a Windows 3.1 dialog. */
export function Dialog({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`w-[min(30rem,92%)] bg-[#c0c0c0] shadow-[4px_4px_0_rgba(0,0,0,0.4)] ${RAISED}`}
    >
      <TitleBar title={title} />
      <div className="px-4 py-3 text-sm text-black">{children}</div>
      {footer ? (
        <div className="flex flex-wrap justify-center gap-2 px-4 pb-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  autoFocus,
}: {
  children: ReactNode;
  onClick: () => void;
  /** Set on a dialog's default button so keyboard players can just press Enter. */
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // biome-ignore lint/a11y/noAutofocus: focusing a modal dialog's default button is the accessible behaviour, not a trap
      autoFocus={autoFocus}
      className={`min-w-24 bg-[#c0c0c0] px-4 py-1 text-sm text-black active:border-t-[#4a4a4a] active:border-l-[#4a4a4a] active:border-r-white active:border-b-white ${RAISED}`}
    >
      {children}
    </button>
  );
}
