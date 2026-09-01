import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, CheckCheck, Trash2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

export default function InquiriesAdmin() {
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => (await api.get("/admin/inquiries")).data,
  });

  const markRead = async (inq) => {
    try {
      await api.patch(`/admin/inquiries/${inq.id}`, { status: "read" });
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async (inq) => {
    if (!window.confirm(`Delete inquiry from "${inq.name}"?`)) return;
    try {
      await api.delete(`/admin/inquiries/${inq.id}`);
      toast.success("Inquiry deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const view = async (inq) => {
    setViewing(inq);
    if (inq.status === "new") await markRead(inq);
  };

  return (
    <div data-testid="admin-inquiries">
      <h1 className="font-serif text-4xl font-medium">Inquiries</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        B2B quotation requests submitted through the contact form.
      </p>

      <div className="mt-8 border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Received</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Company</TableHead>
              <TableHead className="text-muted-foreground">Country</TableHead>
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border"><TableCell colSpan={7} className="text-muted-foreground">Loading…</TableCell></TableRow>
            ) : (inquiries || []).length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground" data-testid="inquiries-empty">
                  No inquiries yet. They will appear here when visitors submit the contact form.
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inq) => (
                <TableRow key={inq.id} className="border-border" data-testid={`inquiry-row-${inq.id}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{fmtDate(inq.created_at)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-bone">{inq.name}</div>
                    <div className="text-xs text-muted-foreground">{inq.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inq.company || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inq.country || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inq.product || "General"}</TableCell>
                  <TableCell>
                    <Badge variant={inq.status === "new" ? "default" : "secondary"} className={inq.status === "new" ? "bg-brass text-ink" : ""}>
                      {inq.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button data-testid={`inquiry-view-${inq.id}`} onClick={() => view(inq)} className="mr-3 text-muted-foreground transition-colors hover:text-brass" aria-label="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    {inq.status === "new" && (
                      <button data-testid={`inquiry-read-${inq.id}`} onClick={() => markRead(inq)} className="mr-3 text-muted-foreground transition-colors hover:text-brass" aria-label="Mark read">
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button data-testid={`inquiry-delete-${inq.id}`} onClick={() => remove(inq)} className="text-muted-foreground transition-colors hover:text-red-400" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl border-border bg-card text-bone" data-testid="inquiry-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Inquiry from {viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email</span><p className="mt-1">{viewing.email}</p></div>
                <div><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Company</span><p className="mt-1">{viewing.company || "—"}</p></div>
                <div><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Country</span><p className="mt-1">{viewing.country || "—"}</p></div>
                <div><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Product</span><p className="mt-1">{viewing.product || "General"}</p></div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Message</span>
                <p className="mt-2 whitespace-pre-wrap border border-border bg-ink p-4 leading-relaxed text-bone/90" data-testid="inquiry-message-view">
                  {viewing.message}
                </p>
              </div>
              <a
                href={`mailto:${viewing.email}?subject=${encodeURIComponent("Re: Your inquiry — PT. Murfy Alam Indonesia")}`}
                data-testid="inquiry-reply-btn"
                className="inline-block bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight"
              >
                Reply by Email
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
