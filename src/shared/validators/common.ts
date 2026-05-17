import z from "zod";

export const uuidValidiation = z.uuid("Invalid ID");
export const pageSizeValidiaiton = z.coerce
  .number("Page size must be a number")
  .min(1)
  .max(1000)
  .positive()
  .default(10)
  .catch(10)
  .optional();

export const pageNumberValidation = z.coerce
  .number("Page size must be a number")
  .min(1)
  .max(1000)
  .positive()
  .default(1)
  .catch(1)
  .optional();
