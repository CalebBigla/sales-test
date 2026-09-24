import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { recordSale, listMySales, deleteSale, updateSale } from "@/lib/sales.functions";
import { listProducts } from "@/lib/stock.functions";
import { Plus, Edit2, Trash2, Check, X, Package, TrendingUp } from "lucide-react";

function Panel({
  title,
  subtitle,
  children,
  icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card transition-smooth hover:shadow-elevated">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div>
          <h2 className="text-heading text-card-foreground font-semibold">{title}</h2>
          {subtitle && <p className="text-caption mt-0.5 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function SalesEntryForm() {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listProducts);
  const fetchSales = useServerFn(listMySales);
  const submitSale = useServerFn(recordSale);
  const removeSale = useServerFn(deleteSale);
  const editSale = useServerFn(updateSale);

  const products = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const sales = useQuery({ queryKey: ["my-sales"], queryFn: () => fetchSales() });

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalAmount, setTotalAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCustomer, setEditCustomer] = useState("");

  const create = useMutation({
    mutationFn: async () =>
      submitSale({
        data: {
          productId,
          quantity: Number(quantity),
          totalAmount: Number(totalAmount),
          ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
        },
      }),
    onMutate: () => {
      setFormError(null);
      setSuccess(false);
    },
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Could not record sale"),
    onSuccess: () => {
      setProductId("");
      setQuantity("1");
      setTotalAmount("");
      setCustomerName("");
      setSuccess(true);
      void queryClient.invalidateQueries({ queryKey: ["my-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["my-target"] });
    },
  });

  const update = useMutation({
    mutationFn: async (id: string) =>
      editSale({
        data: {
          id,
          quantity: Number(editQuantity),
          totalAmount: Number(editAmount),
          ...(editCustomer.trim() ? { customerName: editCustomer.trim() } : {}),
        },
      }),
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Could not update sale"),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["my-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["my-target"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => removeSale({ data: { id } }),
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Could not delete sale"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["my-target"] });
    },
  });

  const startEdit = (sale: {
    id: string;
    quantity: number;
    totalAmount: number;
    customerName: string | null;
  }) => {
    setEditingId(sale.id);
    setEditQuantity(sale.quantity.toString());
    setEditAmount(sale.totalAmount.toString());
    setEditCustomer(sale.customerName ?? "");
    setFormError(null);
  };

  return (
    <>
      <Panel
        title="Record a Sale"
        subtitle="Quick 3-field entry updates your target automatically"
        icon={<Plus className="h-5 w-5 text-accent" />}
      >
        {products.isPending ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-caption text-muted-foreground mt-2">Loading products…</p>
          </div>
        ) : (products.data ?? []).length === 0 ? (
          <div className="text-center py-6 rounded-lg bg-muted/50">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-body text-muted-foreground">
              No products available. Contact your storekeeper.
            </p>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-caption font-medium text-foreground">Product *</span>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                >
                  <option value="">Select product…</option>
                  {(products.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-caption font-medium text-foreground">Quantity *</span>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                  placeholder="1"
                />
              </label>
              <label className="block">
                <span className="text-caption font-medium text-foreground">Amount ($) *</span>
                <input
                  required
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-caption font-medium text-foreground">Customer name (optional)</span>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={200}
                placeholder="Enter customer name"
                className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </label>
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {create.isPending ? "Recording…" : "Record Sale"}
            </button>
          </form>
        )}
        {formError && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-caption text-destructive font-medium">{formError}</p>
          </div>
        )}
        {success && (
          <div className="mt-3 rounded-lg bg-success/10 border border-success/20 p-3">
            <p className="text-caption text-success font-medium flex items-center gap-2">
              <Check className="h-4 w-4" />
              Sale recorded successfully!
            </p>
          </div>
        )}
      </Panel>

      <Panel
        title="My Sales"
        subtitle="Recent entries • Edit or delete within 24 hours"
        icon={<TrendingUp className="h-5 w-5 text-accent" />}
      >
        {sales.isPending ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-caption text-muted-foreground mt-2">Loading your sales…</p>
          </div>
        ) : (sales.data ?? []).length === 0 ? (
          <div className="text-center py-6 rounded-lg bg-muted/50">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-body text-muted-foreground">No sales recorded yet.</p>
            <p className="text-caption text-muted-foreground mt-1">
              Use the form above to record your first sale
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(sales.data ?? []).map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
              >
                {editingId === s.id ? (
                  <div className="p-3 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        type="number"
                        min={1}
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        placeholder="Quantity"
                        className="text-body rounded-lg border-2 border-border bg-background px-3 py-2 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Amount"
                        className="text-body rounded-lg border-2 border-border bg-background px-3 py-2 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                      <input
                        value={editCustomer}
                        onChange={(e) => setEditCustomer(e.target.value)}
                        placeholder="Customer"
                        className="text-body rounded-lg border-2 border-border bg-background px-3 py-2 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => update.mutate(s.id)}
                        disabled={update.isPending}
                        className="flex-1 rounded-lg bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border-2 border-border px-3 py-2 text-caption font-semibold hover:bg-muted flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-body font-medium text-card-foreground">
                        {s.productName}
                      </p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {s.quantity} × ${s.unitPrice.toFixed(2)} = ${s.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {new Date(s.soldAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {s.customerName && ` • ${s.customerName}`}
                      </p>
                    </div>
                    {s.canEdit ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="rounded-lg border-2 border-border px-3 py-1.5 text-caption font-medium hover:bg-muted flex items-center gap-1.5"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this sale? This cannot be undone.")) {
                              remove.mutate(s.id);
                            }
                          }}
                          disabled={remove.isPending}
                          className="rounded-lg border-2 border-destructive px-3 py-1.5 text-caption font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-muted text-caption text-muted-foreground font-medium">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
