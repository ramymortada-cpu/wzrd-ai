import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "!bg-[#111111] !border !border-white/[0.08]",
            "!text-zinc-200 !rounded-2xl",
            "!shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
            "backdrop-blur-xl",
          ].join(" "),
          title: "!text-zinc-100 !font-medium !text-sm",
          description: "!text-zinc-500 !text-xs",
          actionButton:
            "!bg-cyan-500/10 !text-cyan-400 !border !border-cyan-500/20 !rounded-lg !text-xs",
          cancelButton: "!bg-white/[0.04] !text-zinc-400 !rounded-lg !text-xs",
          success: "!border-green-500/20",
          error: "!border-red-500/20",
          warning: "!border-yellow-500/20",
          info: "!border-cyan-500/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
