import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

function SelectionGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col items-start divide-y-2 divide-black border-2 border-black shadow-[4px_4px_0_0] dark:divide-white dark:border-white dark:shadow-[4px_4px_0_0_#fff]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SelectionItemProps extends Omit<React.ComponentProps<"label">, "onChange" | "title"> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  value?: string
}

function SelectionItem({
  className,
  checked,
  onChange,
  title,
  description,
  disabled,
  value,
  ...props
}: SelectionItemProps) {
  return (
    <label
      className={cn(
        "inline-flex w-full items-start gap-3 p-4 transition-colors focus-within:bg-yellow-300 hover:bg-yellow-100 cursor-pointer dark:focus-within:bg-yellow-900/30 dark:hover:bg-yellow-900/10",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent focus-within:bg-transparent",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="peer size-6 shrink-0 appearance-none border-2 border-black shadow-[2px_2px_0_0] shadow-black checked:bg-black focus:ring-2 focus:ring-black dark:border-white dark:shadow-white dark:checked:bg-white dark:focus:ring-white"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          value={value}
        />
        <Check className="pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 dark:text-black" />
      </div>

      <div className="grid gap-0.5">
        <strong className="font-semibold">{title}</strong>

        {description && (
          <div className="text-sm text-muted-foreground text-pretty">
            {description}
          </div>
        )}
      </div>
    </label>
  )
}

export { SelectionGroup, SelectionItem }
