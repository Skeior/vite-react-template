import React, { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "emailjs-com";
import "./Contact.css";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      message: formData.message
    };

    emailjs.send(
      "service_pnwsiys",   // EmailJS Service ID
      "template_ey6j43e",  // EmailJS Template ID
      templateParams,
      "dd49VlOMNa9v-NiJ-"    // EmailJS Public Key
    )
    .then(() => {
      alert("Mesajınız gönderildi! Teşekkürler.");
      setFormData({ name: "", email: "", message: "" });
    })
    .catch((err) => {
      console.error("EmailJS error:", err);
      alert("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <motion.header
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="header-title">İletişim</h1>
        <p className="header-subtitle">
          Bana ulaşmak için aşağıdaki formu kullanabilirsiniz veya direkt iletişim bilgilerini kullanabilirsiniz.
        </p>
      </motion.header>

      {/* Contact Info + Form Card */}
      <motion.section
        className="contact-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="contact-info">
          <p>
            <a href="mailto:talhakarasu2@gmail.com" className="contact-link">
              talhakarasu2@gmail.com
            </a>
          </p>
          <p className="contact-links">
            <a href="https://github.com/skeior" className="contact-link" target="_blank">GitHub</a>
            <a href="https://linkedin.com/in/talhakarasu" className="contact-link" target="_blank">LinkedIn</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Adınız"
            required
            className="contact-input"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="contact-input"
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Mesajınız"
            required
            rows={5}
            className="contact-input"
          />
          <button type="submit" className="button">
            Gönder
          </button>
        </form>
      </motion.section>
    </div>
  );
};

export default ContactPage;
