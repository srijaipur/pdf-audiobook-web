declare module "unpdf" {
  const unpdf: (buffer: Buffer) => Promise<{ text: string }>;
  export = unpdf;
}