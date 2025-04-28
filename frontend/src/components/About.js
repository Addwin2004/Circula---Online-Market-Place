import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import missionImage from '../assets/mission.jpg';
import visionImage from '../assets/vision.jpg';
import valueImage from '../assets/value.jpg';
import mypic from '../assets/mypic.jpg';
import abt from '../assets/about.jpg';
import firstAbout from '../assets/first-about.png';
import secondAbout from '../assets/second-about.png';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState('mission');
  const [hoveredImage, setHoveredImage] = useState(null);

  const tabContent = {
    mission: {
      title: "Our Mission",
      content: "To empower individuals by providing a platform for sustainable living. At Circula, our mission is to redefine consumption by encouraging the reuse, resale, and recycling of products, ultimately reducing environmental impact.",
      image: missionImage
    },
    vision: {
      title: "Our Vision",
      content: "Our vision is to build a world where every product serves its maximum purpose, and waste becomes a thing of the past. We aim to lead the way in promoting a circular economy that benefits both the environment and the community.",
      image: visionImage
    },
    values: {
      title: "Our Values",
      content: "We value sustainability, innovation, and collaboration. These values guide our actions as we strive to create a meaningful impact by connecting people and fostering a community dedicated to responsible consumption.",
      image: valueImage
    }
  };

  const founderInfo = {
    name: "Addwin Antony Stephen",
    role: "Founder & CEO",
    image: mypic,
    bio: "Addwin Antony Stephen has a strong interest in technology. He started Circula to transform online marketplaces by fusing innovation and sustainability. Circula's goal of making the world greener and more connected is propelled by Addwin's visionary approach and dedication to empowering responsible consumption."
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 min-h-screen pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-16 gradient-text">
            About Circula
          </h1>
          
          {/* Mission, Vision, Values Tabs with Image */}
          <div className="mb-24 flex flex-col md:flex-row gap-12">
            <div className="md:w-2/3">
              {/* Centered buttons container */}
              <div className="flex justify-center items-center w-full mb-12">
                <div className="inline-flex space-x-6 justify-center">
                  {Object.keys(tabContent).map((tab) => (
                    <motion.button
                      key={tab}
                      className={`px-10 py-4 rounded-full text-base font-medium transition-all duration-300 ${
                        activeTab === tab 
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-violet-100 hover:text-violet-600'
                      }`}
                      onClick={() => setActiveTab(tab)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tabContent[tab].title}
                    </motion.button>
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl p-8 md:p-12"
                >
                  <h2 className="text-3xl font-semibold mb-6 text-violet-600">{tabContent[activeTab].title}</h2>
                  <p className="text-gray-600 leading-relaxed mb-8 text-lg">{tabContent[activeTab].content}</p>
                  <motion.div 
                    className="relative overflow-hidden rounded-xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={tabContent[activeTab].image} 
                      alt={tabContent[activeTab].title} 
                      className="w-full h-[400px] object-cover object-center transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                      <p className="text-white text-xl font-semibold">{tabContent[activeTab].title} in Action</p>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* First About Image */}
            <div className="md:w-1/3 flex items-start justify-center">
              <div className="w-full bg-white rounded-2xl p-4 shadow-lg">
                <img 
                  src={firstAbout} 
                  alt="About Circula"
                  className="w-full h-[500px] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="mb-24 max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">Meet Our Founder</h2>
          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden md:flex"
            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="md:w-1/3 h-96 md:h-auto relative">
              <img 
                src={founderInfo.image} 
                alt={founderInfo.name} 
                className="absolute w-full h-full object-cover object-center transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-600/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                <p className="text-white text-xl font-semibold">{founderInfo.name}</p>
              </div>
            </div>
            <div className="p-8 md:p-12 md:w-2/3">
              <h3 className="text-3xl font-semibold text-gray-800 mb-2">{founderInfo.name}</h3>
              <p className="text-violet-600 text-xl mb-6">{founderInfo.role}</p>
              <p className="text-gray-600 leading-relaxed text-lg">{founderInfo.bio}</p>
            </div>
          </motion.div>
        </div>

        {/* About Circula with Image */}
        <div className="max-w-7xl mx-auto mb-24">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">About Circula</h2>
          <div className="flex flex-col md:flex-row gap-12">
            {/* Second About Image */}
            <div className="md:w-1/3">
              <div className="w-full bg-white rounded-2xl p-4 shadow-lg">
                <img 
                  src={secondAbout} 
                  alt="About Circula"
                  className="w-full h-[500px] object-contain rounded-xl"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <div className="bg-white rounded-2xl p-8 md:p-12 h-full">
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  Circula is more than just a marketplace; it's a movement towards sustainable living and conscious consumption. Founded in 2023, our platform connects eco-conscious consumers with sellers who share our vision for a greener future.
                </p>
                <motion.div 
                  className="h-80 mb-8 rounded-xl overflow-hidden relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  onHoverStart={() => setHoveredImage('marketplace')}
                  onHoverEnd={() => setHoveredImage(null)}
                >
                  <img 
                    src={abt} 
                    alt="Circula Marketplace Overview"
                    className="w-full h-full object-cover"
                  />
                  <AnimatePresence>
                    {hoveredImage === 'marketplace' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-violet-600/80 flex items-center justify-center"
                      >
                        <p className="text-white text-2xl font-semibold">Discover Our Marketplace</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  We carefully curate our selection of products, ensuring that each item meets our strict standards for quality, sustainability, and ethical production. From upcycled fashion to zero-waste home goods, every product on Circula has a story to tell and a positive impact to make.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="max-w-5xl mx-auto mb-24">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">Contact Us</h2>
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-100 to-pink-100 rounded-xl"
              >
                <h3 className="text-2xl font-semibold text-violet-600 mb-4">Phone</h3>
                <p className="text-gray-700 text-lg">+91 8089011380</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-100 to-pink-100 rounded-xl"
              >
                <h3 className="text-2xl font-semibold text-violet-600 mb-4">Email</h3>
                <p className="text-gray-700 text-lg">contact@circula.com</p>
              </motion.div>
            </div>
            <p className="text-center text-gray-600 mt-8">
              We'd love to hear from you! Reach out to us for any inquiries or feedback.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;