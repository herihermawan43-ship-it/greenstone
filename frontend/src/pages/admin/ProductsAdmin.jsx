import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function ProductsAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Product deleted.");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium">Products</h1>
          <p className="mt-2 text-sm text-muted-foreground">The public catalogue at /products.</p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          data-testid="product-add-btn"
          className="flex items-center gap-2 bg-moss px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight"
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="mt-8 border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground">Category</TableHead>
              <TableHead className="text-muted-foreground">Featured</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border"><TableCell colSpan={4} className="text-muted-foreground">Loading…</TableCell></TableRow>
            ) : (
              (products || []).map((p) => (
                <TableRow key={p.id} className="border-border" data-testid={`product-row-${p.slug}`}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      {p.image && <img src={p.image} alt="" className="h-10 w-14 border border-border object-cover" />}
                      <div>
                        <div className="text-sm text-bone">{p.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-sm">{p.featured ? <span className="text-brass">Yes</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <button data-testid={`product-edit-${p.slug}`} onClick={() => navigate(`/admin/products/${p.id}/edit`)} className="mr-3 text-muted-foreground transition-colors hover:text-brass" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button data-testid={`product-delete-${p.slug}`} onClick={() => remove(p)} className="text-muted-foreground transition-colors hover:text-red-400" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
