// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, Td, Th } from "./table";

describe("Table cards mode", () => {
  it("states table roles explicitly so block layout keeps the semantics", () => {
    render(
      <Table caption="Orders, 1 to 1 of 1" cards>
        <thead role="rowgroup">
          <tr role="row">
            <Th role="columnheader" aria-sort="ascending">
              Due
            </Th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          <tr role="row">
            <Td role="cell">x</Td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole("table", { name: /^Orders, / })).toHaveAttribute("role", "table");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "Due" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("cell")).toBeInTheDocument();
  });

  it("leaves native semantics alone when not in cards mode", () => {
    const { container } = render(
      <Table caption="Plain">
        <tbody>
          <tr>
            <Td>x</Td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(container.querySelector("table")).not.toHaveAttribute("role");
  });
});
