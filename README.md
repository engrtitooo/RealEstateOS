# 🏡 RealEstateOS

**Transform empty properties into dream homes instantly with Gemini 2.0 and Imagen 3.**

![Project Banner](public/banner-placeholder.png) <!-- Replace with an actual screenshot or banner -->

## 🏆 Built for the Google Gemini API Developer Competition
**RealEstateOS** is an AI-powered platform that revolutionizes real estate marketing. By leveraging the multimodal capabilities of **Gemini 2.0 Flash** and the photorealistic generation of **Imagen 3**, we automate the most expensive and time-consuming parts of selling a home: staging and design visualization.

---

## 💡 The Problem
In real estate, **visualization is everything**.
*   **Empty rooms don't sell:** Buyers struggle to imagine the potential of an empty space.
*   **Staging is expensive:** Physical staging costs thousands of dollars and takes weeks.
*   **Floor plans are abstract:** 2D blueprints are hard for the average buyer to understand emotionally.

## 🚀 The Solution
**RealEstateOS** provides a comprehensive suite of AI tools to "finish" a home digitally in seconds.

### Key Features

#### 1. 🛋️ AI Virtual Staging (Multimodal Vision)
Upload a photo of an empty room. Our system uses **Gemini 2.0 Flash** to analyze the room's geometry, lighting, and architectural features (windows, doors, perspective). It then engineers a precise prompt for **Imagen 3** to furnish the room in your chosen style (Modern, Scandinavian, Luxury, etc.) while **preserving the exact camera angle and room structure**.

#### 2. 🏠 Floor Plan to Full Home Design
Upload a simple 2D floor plan (image or PDF).
*   **Analyze:** Gemini Vision extracts every room, its function, and dimensions from the blueprint.
*   **Design:** The AI creates a cohesive "Design System" (flooring, materials, color palette) for the whole house.
*   **Visualize:** Generates a stunning **3D Isometric View** of the entire home layout.
*   **Render:** Automatically generates photorealistic views for each individual room.

#### 3. ✍️ Instant MLS Listing Copy
Stop struggling with descriptions. Based on the visual analysis of the home's features and the applied design style, **Gemini** generates professional, emotional, and sales-ready listing descriptions in seconds.

---

## 🛠️ Tech Stack & AI Models

*   **Frontend:** Next.js 14, React, TailwindCSS, Framer Motion
*   **AI Orchestration:** Google Generative AI SDK (`@google/generative-ai`)
*   **Vision & Reasoning Model:** `gemini-2.0-flash-exp`
    *   Used for: Room geometry analysis, floor plan understanding, design system creation, and prompt engineering.
*   **Image Generation Model:** `imagen-3.0-generate-002`
    *   Used for: Photorealistic virtual staging, 3D floor plan rendering, and interior design visualization.

---

## 📸 Demo

> **[Link to Demo Video]** (Add your YouTube/Loom link here)

### Screenshots
| Virtual Staging | 3D Floor Plan |
|:---:|:---:|
| ![Staging Demo](public/demo-staging.png) | ![Floor Plan Demo](public/demo-plan.png) |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   A Google Cloud Project with the **Gemini API** enabled.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/engrtitooo/RealEstateOS.git
    cd RealEstateOS
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file in the root directory:
    ```env
    GOOGLE_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧠 How It Works (Under the Hood)

1.  **The "Director" Agent (Gemini 2.0 Flash):**
    When you upload an image, we don't just send it to an image generator. We first pass it to Gemini 2.0 Flash with a system prompt acting as a "Senior Interior Designer". It analyzes the *physics* of the room—light sources, perspective lines, and scale.

2.  **Prompt Engineering:**
    Gemini then writes a highly technical prompt for Imagen 3. Instead of just saying "add a sofa", it specifies "a low-profile beige linen sofa positioned at coordinates X,Y to match the vanishing point of the left wall, lit by soft afternoon sun from the west-facing window."

3.  **Generation:**
    Imagen 3 executes this prompt, filling the empty space with furniture that matches the perspective perfectly.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
