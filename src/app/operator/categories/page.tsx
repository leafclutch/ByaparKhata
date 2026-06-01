"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, ChevronDown, Edit2, Trash2, Tag, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/services/categories";
import type { Category } from "@/lib/types";

function buildTree(cats: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];
  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(cat);
    } else if (!cat.parent_id) {
      roots.push(cat);
    }
  });
  return roots;
}

function getBreadcrumb(cats: Category[], id: string): string {
  const path: string[] = [];
  let current: Category | undefined = cats.find((c) => c.id === id);
  while (current) {
    path.unshift(current.name);
    current = current.parent_id ? cats.find((c) => c.id === current!.parent_id) : undefined;
  }
  return path.join(" › ");
}

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#7c3aed", "#dc2626", "#64748b"];

interface CategoryNodeProps {
  cat: Category;
  allCats: Category[];
  depth: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddChild: (parentId: string) => void;
}

function CategoryNode({ cat, allCats, depth, onEdit, onDelete, onAddChild }: CategoryNodeProps) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (cat.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-slate-50 group transition-colors"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-5 h-5 flex items-center justify-center text-slate-400 flex-shrink-0"
        >
          {hasChildren ? (
            open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          )}
        </button>

        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color ?? "#94a3b8" }} />

        <span className="text-sm font-medium text-slate-800 flex-1">{cat.name}</span>

        {cat.level !== undefined && (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded hidden sm:block">
            Level {cat.level}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(cat.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Add subcategory"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(cat)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {cat.children!.map((child) => (
              <CategoryNode
                key={child.id}
                cat={child}
                allCats={allCats}
                depth={depth + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>();
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState<string>("none");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCategories(user.company_id).then(setCategories).catch(() => toast.error("Failed to load categories."));
  }, [user]);

  const tree = buildTree(categories);

  function openAdd(parentId?: string) {
    setEditTarget(null);
    setFormName("");
    setFormParentId(parentId ?? "none");
    setFormColor(COLORS[0]);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setFormName(cat.name);
    setFormParentId(cat.parent_id ?? "none");
    setFormColor(cat.color ?? COLORS[0]);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error("Category name is required."); return; }
    if (!user) return;
    setSaving(true);
    try {
      const resolvedParentId = formParentId === "none" ? undefined : formParentId;
      const parent = resolvedParentId ? categories.find((c) => c.id === resolvedParentId) : undefined;
      const level = parent ? (parent.level ?? 0) + 1 : 0;
      const slug = formName.toLowerCase().replace(/\s+/g, "-");

      if (editTarget) {
        const updated = await updateCategory(editTarget.id, { name: formName, parent_id: resolvedParentId, level, slug, color: formColor });
        setCategories((prev) => prev.map((c) => c.id === editTarget.id ? { ...c, ...updated } : c));
        toast.success("Category updated.");
      } else {
        const created = await createCategory({ company_id: user.company_id, name: formName, parent_id: resolvedParentId, slug, level, color: formColor });
        setCategories((prev) => [...prev, created]);
        toast.success("Category created.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id && c.parent_id !== deleteTarget.id));
      toast.success("Category deleted.");
    } catch {
      toast.error("Failed to delete category.");
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Categories</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage product categories with unlimited nesting</p>
        </div>
        <Button onClick={() => openAdd()} className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm"
      >
        <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category Tree</span>
          <span className="ml-auto text-xs text-slate-400">{categories.length} total</span>
        </div>
        <div className="p-2">
          {tree.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No categories yet</p>
            </div>
          ) : (
            tree.map((cat) => (
              <CategoryNode
                key={cat.id}
                cat={cat}
                allCats={categories}
                depth={0}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onAddChild={openAdd}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Update the category name, parent, or colour." : "Create a new category in your product hierarchy."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mobile Phones"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select value={formParentId} onValueChange={setFormParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root category)</SelectItem>
                  {categories
                    .filter((c) => c.id !== editTarget?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span style={{ paddingLeft: `${(cat.level ?? 0) * 12}px` }}>
                          {(cat.level ?? 0) > 0 ? "└ " : ""}{cat.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formParentId !== "none" && (
                <p className="text-xs text-slate-400">
                  Path: {getBreadcrumb(categories, formParentId)} › {formName || "…"}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: formColor === color ? "white" : color,
                      boxShadow: formColor === color ? `0 0 0 2px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteTarget?.name}</strong> and all its subcategories? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
