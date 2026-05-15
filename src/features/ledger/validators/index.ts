import {
  pageSizeValidiaiton,
  uuidValidiation,
} from "@src/shared/validators/common";
import z from "zod";

export const LedgerRouteParams = z.object({ memberId: uuidValidiation });

export const LedgerQueryParams = z.object({
  page: pageSizeValidiaiton,
  pageSize: pageSizeValidiaiton,
});
