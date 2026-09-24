import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createProduct,
  fulfilStockRequest,
  listProducts,
  listStockRequests,
  rejectStockRequest,
} from "@/lib/stock.functions";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  TrendingDown,
} from "lucide-react";

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

export function StockQueue() {
  const queryClient = useQueryClient();
  const fetchRequests = useServerFn(listStockRequests);
  const fetchProducts = useServerFn(listProducts);
  const fulfil = useServerFn(fulfilStockRequest);
  const reject = useServerFn(rejectStockRequest);
  const addProduct = useServerFn(createProduct);
  const [actionError, setActionError] = useState<string | null>(null);

  const requests = useQuery({ queryKey: ["stock-requests"], queryFn: () => fetchRequests() });
  const products = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const decide = useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) =>
      input.approve
        ? fulfil({ data: { requestId: input.id } })
        : reject({ data: { requestId: input.id } }),
    onMutate: () => setActionError(null),
    onError: (error) => setActionError(error instanceof Error ? error.message : "Action failed"),
    onSuccess: refresh,
  });

  const [form, setForm] = useState({
    sku: "",
    name: "",
    unit: "each",
    stockOnHand: "0",
    reorderLevel: "0",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () =>
      addProduct({
        data: {
          sku: form.sku,
          name: form.name,
          unit: form.unit,
          stockOnHand: Number(form.stockOnHand),
          reorderLevel: Number(form.reorderLevel),
        },
      }),
    onMutate: () => setFormError(null),
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Could not add product"),
    onSuccess: () => {
      setForm({ sku: "", name: "", unit: "each", stockOnHand: "0", reorderLevel: "0" });
      refresh();
    },
  });

  const pending = (requests.data ?? []).filter((r) => r.status === "pending");
  const history = (requests.data ?? [])
    .filter((r) => r.status !== "pending")
    .slice(-10)
    .reverse();

  return (
    <>
      <Panel
        title="Pending Stock Requests"
        subtitle="Oldest requests first • Approve or reject below"
        icon={<Clock className="h-5 w-5 text-accent" />}
      >
        {actionError && (
          <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-caption text-destructive font-medium">{actionError}</p>
          </div>
        )}
        {requests.isPending ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-caption text-muted-foreground mt-2">Loading requests…</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-8 rounded-lg bg-muted/50">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
            <p className="text-body text-foreground font-medium">All caught up!</p>
            <p className="text-caption text-muted-foreground mt-1">No pending requests</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border-2 border-warning bg-warning/5 hover:bg-warning/10 transition-colors p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-warning" />
                      <p className="text-body font-semibold text-card-foreground">
                        {r.productName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-caption text-foreground">
                        <span className="font-semibold">Quantity:</span> {r.quantity} {r.unit}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        <span className="font-semibold">Requested by:</span> {r.requestedBy}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        <span className="font-semibold">Date:</span>{" "}
                        {new Date(r.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p
                        className={`text-caption font-medium ${r.stockOnHand === 0 ? "text-destructive" : r.stockOnHand < r.quantity ? "text-warning" : "text-success"}`}
                      >
                        <span className="font-semibold">Stock:</span> {r.stockOnHand} {r.unit}{" "}
                        available
                      </p>
                      {r.note && (
                        <p className="text-caption text-muted-foreground italic mt-2">
                          "{r.note}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: r.id, approve: true })}
                      className="rounded-lg bg-gradient-to-r from-success to-success/80 px-4 py-2.5 font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: r.id, approve: false })}
                      className="rounded-lg border-2 border-border px-4 py-2.5 font-semibold hover:bg-muted disabled:opacity-50 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Stock Levels"
        subtitle="Items at or below low-stock level are flagged"
        icon={<Package className="h-5 w-5 text-accent" />}
      >
        {products.isPending ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-caption text-muted-foreground mt-2">Loading stock…</p>
          </div>
        ) : (products.data ?? []).length === 0 ? (
          <div className="text-center py-8 rounded-lg bg-muted/50">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-body text-foreground font-medium">No products yet</p>
            <p className="text-caption text-muted-foreground mt-1">Add your first product below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(products.data ?? []).map((p) => {
              const critical = p.stockOnHand === 0;
              const lowStock = !critical && p.lowStock;
              const healthy = !critical && !lowStock;

              return (
                <div
                  key={p.id}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    critical
                      ? "border-destructive bg-destructive/10"
                      : lowStock
                        ? "border-warning bg-warning/10"
                        : "border-border bg-background/50 hover:bg-background"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        {critical ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : lowStock ? (
                          <TrendingDown className="h-5 w-5 text-warning" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-success" />
                        )}
                        <p className="text-body font-semibold text-card-foreground">{p.name}</p>
                      </div>
                      <p className="text-caption text-muted-foreground">
                        SKU: {p.sku} • Reorder level: {p.reorderLevel} {p.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-heading font-bold text-card-foreground">
                        {p.stockOnHand} <span className="text-body font-normal">{p.unit}</span>
                      </p>
                      {critical && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-caption font-semibold">
                          Out of Stock
                        </span>
                      )}
                      {lowStock && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-warning text-warning-foreground text-caption font-semibold">
                          Low Stock
                        </span>
                      )}
                      {healthy && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-caption font-semibold">
                          Healthy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Add a Product" icon={<Plus className="h-5 w-5 text-accent" />}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-caption font-medium text-foreground">Product Name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter product name"
                className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-caption font-medium text-foreground">SKU / Code *</span>
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Product code"
                className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-caption font-medium text-foreground">Unit *</span>
              <input
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g., each, box, kg"
                className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-caption font-medium text-foreground">Quantity in Stock *</span>
              <input
                required
                type="number"
                min={0}
                value={form.stockOnHand}
                onChange={(e) => setForm({ ...form, stockOnHand: e.target.value })}
                placeholder="0"
                className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-caption font-medium text-foreground">Low Stock Level *</span>
              <input
                required
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                placeholder="Minimum quantity before alert"
                className="text-body mt-1.5 w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {create.isPending ? "Adding Product…" : "Add Product"}
          </button>
        </form>
        {formError && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-caption text-destructive font-medium">{formError}</p>
          </div>
        )}
      </Panel>

      {history.length > 0 && (
        <Panel title="Recently Decided" icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}>
          <div className="space-y-2">
            {history.map((r) => (
              <div
                key={r.id}
                className={`rounded-lg border p-3 ${
                  r.status === "fulfilled"
                    ? "border-success/30 bg-success/5"
                    : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.status === "fulfilled" ? (
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <p className="text-caption text-foreground">
                    <span className="font-semibold">
                      {r.status === "fulfilled" ? "Approved" : "Rejected"}
                    </span>{" "}
                    • {r.quantity} {r.unit} • {r.productName} • {r.requestedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
