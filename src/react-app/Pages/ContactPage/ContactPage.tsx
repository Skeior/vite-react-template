import React, { useState } from "react";
import { motion } from "framer-motion";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Mesajınız gönderildi! Teşekkürler.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <motion.header
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold mb-2">İletişim</h1>
        <p className="text-lg text-gray-600">
          Bana ulaşmak için aşağıdaki formu kullanabilirsiniz veya direkt iletişim bilgilerini kullanabilirsiniz.
        </p>
      </motion.header>

      {/* Contact Info */}
      <motion.section
        className="text-center mb-8 space-y-2"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <p>
          <a href="mailto:talhakarasu2@gmail.com" className="text-blue-600 underline">
            talhakarasu2@gmail.com
          </a>
        </p>
        <p>
          <a href="https://github.com/skeior" className="text-blue-600 underline">
            GitHub
          </a>{" | "}
          <a href="https://linkedin.com/in/talhakarasu" className="text-blue-600 underline">
            LinkedIn
          </a>
        </p>
      </motion.section>

      {/* Contact Form */}
      <motion.section
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Adınız"
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Mesajınız"
            required
            rows={5}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Gönder
          </button>
        </form>
      </motion.section>
    </div>
  );
};

export default ContactPage;
