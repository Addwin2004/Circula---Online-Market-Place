'use client'
import vertiImage from "../assets/Verti-image.jpg";
import heroImage from "../assets/hero.png";
import { motion } from 'framer-motion'
import { useState , useEffect} from 'react'
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();  // React Router navigation

  const [activeQuestion, setActiveQuestion] = useState(null)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const faqItems = [
    {
      question: "What is Circula's mission?",
      answer: "Circula aims to provide a versatile online marketplace where individuals can buy and sell both new and used items, fostering convenience and sustainability."
    },
    {
      question: "How does the buying process work?",
      answer: "Explore a wide range of categories, select your desired item, and connect directly with the seller. Transactions are handled securely, ensuring a smooth buying experience."
    },
    {
      question: "What's your return policy?",
      answer: "As Circula connects buyers and sellers directly, return policies vary by seller. We encourage clear communication between parties to address any concerns."
    },
    {
      question: "How do you ensure product quality?",
      answer: "Circula provides a platform for sellers to showcase their products, and buyers are encouraged to review listings carefully and communicate with sellers for assurance."
    }
  ];
  

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center bg-gradient-to-br from-violet-100 to-pink-100 ">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[...Array(20)].map((_, i) => (
              <motion.circle
                key={i}
                cx={Math.random() * 100}
                cy={Math.random() * 100}
                r={Math.random() * 2 + 1}
                fill="#8B5CF6"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: Math.random() * 5 + 3,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </svg>
        </div>
        <div className="container mx-auto px-7 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 1.2,
                ease: "easeOut",
                opacity: { duration: 1.5 }
              }}
              className="max-w-xl md:w-1/2"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
                Welcome to the Future of
                <span className="text-violet-600"> Circular Economy</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Join our community of conscious consumers and sellers making a difference,
                one transaction at a time.
              </p>
              <motion.button
      className="px-8 py-4 bg-violet-600 text-white rounded-full font-medium text-lg shadow-lg"
      whileHover={{ scale: 1.05, backgroundColor: "#7C3AED" }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate("/products")}  // Navigate without full reload
    >
      Explore Marketplace
    </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="md:w-1/2 h-[600px] mt-12 md:mt-0 flex justify-center items-center"            >
              <img 
                src={heroImage} 
                alt="Hero" 
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">
                Discover Quality Products with a
                <span className="text-violet-600"> Purpose</span>
              </h2>
              <p className="text-gray-600 mb-8">
                Every item on Circula has a story to tell. From pre-loved treasures to
                sustainable innovations, find unique pieces that align with your values.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {['Verified Sellers', 'Secure Payments', 'Quality Assured', 'Fast Delivery'].map((feature) => (
                  <motion.div
                    key={feature}
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-gray-700">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative h-[600px]"
            >
              <img
                src={vertiImage}
                alt="Circula Features"
                className="w-full h-full object-cover rounded-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Find answers to common questions about Circula</p>
          </motion.div>
          <div className="max-w-2xl mx-auto">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="mb-4"
              >
                <button
                  onClick={() => setActiveQuestion(activeQuestion === index ? null : index)}
                  className="w-full text-left p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{item.question}</span>
                    <motion.span
                      animate={{ rotate: activeQuestion === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-violet-600"
                    >
                      ↓
                    </motion.span>
                  </div>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeQuestion === index ? 'auto' : 0,
                      opacity: activeQuestion === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 text-gray-600">{item.answer}</p>
                  </motion.div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}