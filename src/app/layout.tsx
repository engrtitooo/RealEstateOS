import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "RealEstateOS | AI-Powered Property Staging",
    description: "Transform empty rooms into stunning staged spaces and convert floor plans into complete design concepts. Powered by Google Gemini AI.",
    keywords: ["real estate", "virtual staging", "AI staging", "floor plan design", "property marketing", "MLS listings"],
    authors: [{ name: "RealEstateOS" }],
    openGraph: {
        title: "RealEstateOS | AI-Powered Property Staging",
        description: "Transform empty rooms into stunning staged spaces with AI",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
