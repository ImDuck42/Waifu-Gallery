# Waifu Gallery

**Waifu Gallery** is a web application that serves as a repository for mostly anime-style images. It allows users to browse, search, and create their own collections that includes NSFW content, fan art, and more. The application features a user-friendly interface and offers several useful features.
- My fist time making a MD file, pls be nice
---

## ✨ Features

- **Image Browsing**: Explore a vast collection of images and videos organized by category.
- **Search Functionality**: Easily find images based on tags or categories.
- **API Access**: Utilize the `/api` route for my own version of the [waifu.pics API documentation](https://waifu.pics/docs).
- **Contact Page**: Reach out to the developers or provide feedback via the `/contact` page.
- **Developer Tools**: Access secret developer tools through the `/rawr` route.
- **Responsive Design**: Enjoy a seamless experience across desktops, tablets, and smartphones.

---

## 🚀 Live Website

Experience the application live at:  
[imduck42.github.io/Waifu-Gallery](https://imduck42.github.io/Waifu-Gallery)

---

## 🗂️ Repository Structure

```
Waifu-Gallery/
├── assets/                 # Image assets and static files
├── contact/                # Contact page resources
├── documentation/          # Additional documentation files
├── stuff/                  # Miscellaneous resources
├── 404.html                # Custom 404 error page (redirects to base)
├── app.js                  # Main JavaScript file for application logic
├── index.html              # Main HTML page
├── refactorlist.html       # List of refactoring tasks or updates
├── styles.css              # Stylesheet for the application
```

---

## 🔗 Routes and Endpoints

- `/` : Home page displaying the gallery.
- `/api` : API documentation and access.
- `/contact` : Contact page for user feedback and inquiries.
- `/type/category` : Quickly fetch images by specific categories.
- `/rawr` : Secret developer tools for advanced functionalities.

---

## 🛠️ Technologies Used

- **HTML**: Structure of the web pages.
- **CSS**: Styling and layout.
- **JavaScript**: Interactive functionality and API interactions.

---

## 📁 Custom Sources

Users can create custom image sources in the form of a **.json** file.  
Learn more about how to use them in our [documentation](https://imduck42.github.io/Waifu-Gallery/documentation/indexdocs.html#custom-source).

<details>
<summary><strong>Example layout:</strong></summary>

```json
{
    "sourceInfo": [
        {
            "title": "Custom Source Template",
            "description": "A template for creating custom sources",
            "version": "69.42.0",
            "author": "ImDuck42 (Creator)",
            "contact": "Hu7ao on Discord"
        }
    ],
    "sfw": [
        {
            "category": "nature",
            "information": "Natural landscapes and wildlife",
            "images": [
                "https://example.com/nature1.jpg",
                "https://example.com/nature2.jpg"
            ]
        },
        {
            "category": "anime",
            "information": "Anime artwork and characters",
            "images": [
                "https://example.com/anime1.png",
                "https://example.com/anime2.jpg"
            ]
        }
    ],
    "nsfw": [
        {
            "category": "adult content",
            "information": "Explicit adult material",
            "images": [
                "https://example.com/nsfw1.jpg",
                "https://example.com/nsfw2.png"
            ]
        },
        {
            "category": "sensitive",
            "information": "Other sensitive content",
            "images": [
                "https://example.com/sensitive1.jpg",
                "https://example.com/sensitive2.png"
            ]
        }
    ]
}
```
</details>

---

## 🔧 Getting Started

To set up the project locally:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ImDuck42/Waifu-Gallery.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd Waifu-Gallery
   ```

3. **Open `index.html` in your preferred web browser.**

---

For any further questions or support, please visit the [contact page](https://imduck42.github.io/Waifu-Gallery/contact).