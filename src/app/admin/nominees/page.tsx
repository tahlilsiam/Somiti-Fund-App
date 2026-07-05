import Link from "next/link";
import { Contact } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { listNomineesWithMember } from "@/lib/nominees/queries";
import { NomineesToolbar } from "./nominees-toolbar";

export default async function NomineesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; relation?: string }>;
}) {
  const { q, relation } = await searchParams;
  const all = await listNomineesWithMember();

  // Distinct relations present, for the relation filter.
  const relations = Array.from(
    new Set(
      all
        .map((n) => n.relation?.trim())
        .filter((r): r is string => Boolean(r)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  let rows = all;
  const query = q?.trim().toLowerCase();
  if (query) {
    rows = rows.filter((n) =>
      [n.member_code, n.member_name, n.nominee_name, n.nominee_phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query)),
    );
  }
  if (relation && relation !== "all") {
    rows = rows.filter(
      (n) => (n.relation ?? "").toLowerCase() === relation.toLowerCase(),
    );
  }

  const hasFilters = Boolean(q) || Boolean(relation && relation !== "all");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Nominees"
        description="All member nominees. Edit a nominee from the member's profile."
      />

      <NomineesToolbar relations={relations} />

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Contact}
            title="No nominees match your filters"
            description="Try a different search or relation."
          />
        ) : (
          <EmptyState
            icon={Contact}
            title="No nominees yet"
            description="Nominees are added on a member's profile. Add a member with nominee details to see them here."
          />
        )
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {rows.length} nominee{rows.length === 1 ? "" : "s"}
          </p>
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member code</TableHead>
                  <TableHead>Member name</TableHead>
                  <TableHead>Member phone</TableHead>
                  <TableHead>Nominee name</TableHead>
                  <TableHead>Nominee phone</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">
                      {n.member_code}
                    </TableCell>
                    <TableCell>{n.member_name}</TableCell>
                    <TableCell>{n.member_phone ?? "—"}</TableCell>
                    <TableCell>{n.nominee_name}</TableCell>
                    <TableCell>{n.nominee_phone ?? "—"}</TableCell>
                    <TableCell>{n.relation ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/members/${n.member_id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        View member
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>
        </>
      )}
    </div>
  );
}
