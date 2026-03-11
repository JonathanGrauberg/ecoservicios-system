import { Metadata } from "next"

export const icons: Metadata["icons"] = {
  icon: [
    {
      url: "/icon-light.png",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/icon-dark.png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
}
