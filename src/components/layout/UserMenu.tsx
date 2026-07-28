"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Camera, Pencil, LogOut, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { updateAvatar, updateDisplayName } from "@/app/(app)/profile/actions";
import { resizeImageToDataUrl } from "@/lib/resize-image";
import { useMounted } from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import RenameUserModal from "@/components/layout/RenameUserModal";

type MenuPosition = { top: number; right: number };

export default function UserMenu({
  initialUser,
}: {
  initialUser: { displayName: string; email: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [user, setUser] = useState(initialUser);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isAvatarPending, startAvatarTransition] = useTransition();
  const [isNamePending, startNameTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
      return next;
    });
  }

  function handleChangePhotoClick() {
    setIsOpen(false);
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    startAvatarTransition(async () => {
      const dataUrl = await resizeImageToDataUrl(file);
      setUser((prev) => ({ ...prev, avatarUrl: dataUrl }));
      await updateAvatar(dataUrl);
      router.refresh();
    });
  }

  function handleSaveName(name: string) {
    setIsRenameOpen(false);
    startNameTransition(async () => {
      setUser((prev) => ({ ...prev, displayName: name }));
      await updateDisplayName(name);
      router.refresh();
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors duration-150 ${
          isOpen ? "bg-foreground/10" : "hover:bg-foreground/5"
        }`}
      >
        <div className="relative">
          <Avatar name={user.displayName} avatarUrl={user.avatarUrl} className="h-8 w-8 text-xs" />
          {isAvatarPending ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" strokeWidth={2} />
            </span>
          ) : null}
        </div>
        <span className="max-w-32 truncate font-medium">{user.displayName}</span>
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {mounted && isOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: menuPos.top, right: menuPos.right }}
              className="bg-surface-solid/95 border-surface-border shadow-elevated animate-scale-in fixed z-20 w-60 origin-top-right overflow-hidden rounded-xl border py-1 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar name={user.displayName} avatarUrl={user.avatarUrl} className="h-10 w-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.displayName}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
              </div>

              <div className="border-surface-border my-1 border-t" />

              <MenuItem icon={Camera} label="Cambiar foto" onSelect={handleChangePhotoClick} />
              <MenuItem
                icon={Pencil}
                label="Cambiar nombre de usuario"
                onSelect={() => {
                  setIsOpen(false);
                  setIsRenameOpen(true);
                }}
              />

              <div className="border-surface-border my-1 border-t" />

              <form action={signOut}>
                <MenuItem icon={LogOut} label="Cerrar sesión" type="submit" />
              </form>
            </div>,
            document.body,
          )
        : null}

      <RenameUserModal
        isOpen={isRenameOpen}
        currentName={user.displayName}
        isPending={isNamePending}
        onSave={handleSaveName}
        onClose={() => setIsRenameOpen(false)}
      />
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  type = "button",
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  type?: "button" | "submit";
  onSelect?: () => void;
}) {
  return (
    <button
      type={type}
      role="menuitem"
      onClick={(event) => {
        if (!onSelect) return;
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      className="text-foreground hover:bg-foreground/5 flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-150"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
