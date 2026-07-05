import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { MemberStatusBadge } from "@/components/member-status-badge";
import type { Member } from "@/lib/members/types";

export function MembersTable({ members }: { members: Member[] }) {
  return (
    <DataTableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.member_code}</TableCell>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.phone ?? "—"}</TableCell>
              <TableCell>{m.email ?? "—"}</TableCell>
              <TableCell>{m.joining_date ?? "—"}</TableCell>
              <TableCell>
                <MemberStatusBadge status={m.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/members/${m.id}/edit`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Edit
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableWrapper>
  );
}
