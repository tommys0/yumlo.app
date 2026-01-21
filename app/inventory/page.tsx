"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArchiveBoxIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  priority?: boolean | null;
  created_at: string;
  updated_at: string;
}

const categories = [
  "Maso",
  "Ryby",
  "Mléčné",
  "Vejce",
  "Zelenina",
  "Ovoce",
  "Obiloviny",
  "Luštěniny",
  "Oleje",
  "Koření",
  "Ostatní",
];

const units = [
  { value: "ks", label: "ks (kusy)" },
  { value: "g", label: "g (gramy)" },
  { value: "kg", label: "kg (kilogramy)" },
  { value: "ml", label: "ml (mililitry)" },
  { value: "l", label: "l (litry)" },
  { value: "balení", label: "balení" },
];

const categoryOrder = categories;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null);

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<InventoryItem[]>([]);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "ks",
    category: "Ostatní",
  });

  useEffect(() => {
    loadInventory();
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Escape key for modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (deleteConfirm) {
          setDeleteConfirm(null);
        } else if (showAddModal || editingItem) {
          closeModal();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAddModal, editingItem, deleteConfirm]);

  // Focus name input when modal opens
  useEffect(() => {
    if ((showAddModal || editingItem) && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showAddModal, editingItem]);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadInventory = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/inventory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load inventory");

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle name input change with autocomplete
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });

    if (value.trim().length >= 2 && !editingItem) {
      const matches = items.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setAutocompleteResults(matches);
      setShowAutocomplete(matches.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  };

  // Select item from autocomplete - switch to edit mode
  const selectAutocompleteItem = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      quantity: item.quantity?.toString() || "",
      unit: item.unit || "ks",
      category: item.category || "Ostatní",
    });
    setEditingItem(item);
    setShowAddModal(false);
    setShowAutocomplete(false);
  };

  const handleAddItem = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit || null,
          category: formData.category || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add item");

      const data = await response.json();
      setItems((prev) => [...prev, data.item]);
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding item:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.name.trim()) return;

    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/inventory/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit || null,
          category: formData.category || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      const data = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? data.item : item))
      );
      resetForm();
      setEditingItem(null);
    } catch (err) {
      console.error("Error updating item:", err);
    } finally {
      setSaving(false);
    }
  };

  // Quick add - increment quantity
  const handleQuickAdd = async (item: InventoryItem) => {
    const currentQty = item.quantity || 0;
    let increment = 1;

    // Smart increment based on unit
    if (item.unit === "g") increment = 100;
    else if (item.unit === "kg") increment = 0.5;
    else if (item.unit === "ml") increment = 100;
    else if (item.unit === "l") increment = 0.5;

    const newQuantity = currentQty + increment;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      const data = await response.json();
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? data.item : i))
      );
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  // Toggle priority status
  const togglePriority = async (item: InventoryItem) => {
    const newPriority = item.priority !== true;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, priority: newPriority } : i))
    );

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priority: newPriority,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, priority: item.priority } : i))
        );
        throw new Error("Failed to update item");
      }

      const data = await response.json();
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? data.item : i))
      );
    } catch (err) {
      console.error("Error toggling priority:", err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/inventory/${deleteConfirm.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete item");

      setItems((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      unit: "ks",
      category: "Ostatní",
    });
    setShowAutocomplete(false);
  };

  const openEditModal = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      quantity: item.quantity?.toString() || "",
      unit: item.unit || "ks",
      category: item.category || "Ostatní",
    });
    setEditingItem(item);
  };

  const closeModal = useCallback(() => {
    resetForm();
    setShowAddModal(false);
    setEditingItem(null);
  }, []);

  // Group and filter items
  const filteredItems =
    filterCategory === "all"
      ? items
      : items.filter((item) => (item.category || "Ostatní") === filterCategory);

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      const category = item.category || "Ostatní";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, InventoryItem[]>
  );

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" role="status">
          <span className="sr-only">Načítání…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ArchiveBoxIcon className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventář</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {items.length} {items.length === 1 ? "položka" : items.length < 5 ? "položky" : "položek"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" aria-hidden="true" />
          Přidat položku
        </button>
      </div>

      {/* Filter */}
      {items.length > 0 && (
        <div className="mb-6" role="group" aria-label="Filtrovat podle kategorie">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400" id="filter-label">Filtr:</span>
            <button
              onClick={() => setFilterCategory("all")}
              aria-pressed={filterCategory === "all"}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
                filterCategory === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Vše
            </button>
            {categories.map((cat) => {
              const count = items.filter(
                (item) => (item.category || "Ostatní") === cat
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  aria-pressed={filterCategory === cat}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
                    filterCategory === cat
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <ArchiveBoxIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Váš inventář je prázdný
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Přidejte položky do inventáře, abyste měli přehled o tom, co máte
            doma.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" aria-hidden="true" />
            Přidat první položku
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Žádné položky v kategorii „{filterCategory}"
          </p>
        </div>
      ) : (
        /* Inventory list by category */
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <section
              key={category}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              aria-labelledby={`category-${category}`}
            >
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 id={`category-${category}`} className="font-semibold text-gray-900 dark:text-white">{category}</h2>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {groupedItems[category].map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {item.priority && (
                        <StarSolidIcon className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white truncate block">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right tabular-nums">
                      {item.quantity !== null ? (
                        <>
                          {item.quantity}&nbsp;{item.unit || ""}
                        </>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePriority(item);
                        }}
                        className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                          item.priority === true
                            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        }`}
                        aria-label={item.priority ? `Odebrat prioritu: ${item.name}` : `Nastavit prioritu: ${item.name}`}
                      >
                        {item.priority === true ? (
                          <StarSolidIcon className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <StarOutlineIcon className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item)}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        aria-label={`Přidat více: ${item.name}`}
                      >
                        <PlusIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        aria-label={`Upravit: ${item.name}`}
                      >
                        <PencilIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(item)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        aria-label={`Smazat: ${item.name}`}
                      >
                        <TrashIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? "Upravit položku" : "Přidat položku"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="Zavřít"
              >
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name with Autocomplete */}
              <div className="relative" ref={autocompleteRef}>
                <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Název *
                </label>
                <input
                  ref={nameInputRef}
                  id="item-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => {
                    if (formData.name.trim().length >= 2 && !editingItem && autocompleteResults.length > 0) {
                      setShowAutocomplete(true);
                    }
                  }}
                  placeholder="např. Mléko…"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {/* Autocomplete dropdown */}
                {showAutocomplete && autocompleteResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                      Existující položky – kliknutím upravíte
                    </div>
                    {autocompleteResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => selectAutocompleteItem(item)}
                        className="w-full px-3 py-2 text-left hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-between focus-visible:outline-none focus-visible:bg-green-50 dark:focus-visible:bg-green-900/20"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity !== null && `${item.quantity}\u00A0${item.unit || ""}`}
                          {item.category && ` · ${item.category}`}
                        </span>
                      </button>
                    ))}
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                      Nebo pokračujte v psaní pro novou položku
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Množství
                  </label>
                  <input
                    id="item-quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="item-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jednotka
                  </label>
                  <select
                    id="item-unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {units.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="item-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategorie
                </label>
                <select
                  id="item-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Zrušit
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                {saving
                  ? "Ukládám…"
                  : editingItem
                    ? "Uložit změny"
                    : "Přidat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <h2 id="delete-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Smazat položku?
              </h2>
            </div>
            <p id="delete-description" className="text-gray-600 dark:text-gray-400 mb-6">
              Opravdu chcete smazat „{deleteConfirm.name}"? Tuto akci nelze vrátit.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Zrušit
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
