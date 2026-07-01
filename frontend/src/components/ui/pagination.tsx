import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants, type Button } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("rt-pagination-content flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        "rt-pagination-link",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("rt-pagination-previous gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("rt-pagination-next gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("rt-pagination-ellipsis flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const items: PageItem[] = [0];
  const start = Math.max(currentPage - 1, 1);
  const end = Math.min(currentPage + 1, totalPages - 2);

  if (start > 1) {
    items.push("ellipsis-start");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 2) {
    items.push("ellipsis-end");
  }

  items.push(totalPages - 1);
  return items;
}

function TablePagination({
  page,
  totalPages,
  first,
  last,
  onPrev,
  onNext,
  onPageChange,
}: TablePaginationProps) {
  const displayTotalPages = Math.max(totalPages, 1);
  const pageItems = getPageItems(page, displayTotalPages);

  return (
    <div className="rt-pagination">
      <Pagination className="w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-label="이전 페이지"
              text="이전"
              aria-disabled={first ? true : undefined}
              className={first ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (!first) {
                  onPrev();
                }
              }}
            />
          </PaginationItem>
          {pageItems.map((item) => {
            if (typeof item !== "number") {
              return (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  aria-label={`${item + 1} 페이지`}
                  onClick={(event) => {
                    event.preventDefault();
                    if (item !== page) {
                      onPageChange(item);
                    }
                  }}
                >
                  {item + 1}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-label="다음 페이지"
              text="다음"
              aria-disabled={last ? true : undefined}
              className={last ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (!last) {
                  onNext();
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  TablePagination,
};
