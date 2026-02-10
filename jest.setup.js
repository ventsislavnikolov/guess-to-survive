import "@testing-library/jest-dom";

jest.mock("./auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
    },
    coupons: {
      list: jest.fn(),
    },
  }))
);

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
}));
