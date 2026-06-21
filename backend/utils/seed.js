const User = require("../models/User")
const EntrepreneurProfile = require("../models/EntrepreneurProfile")
const InvestorProfile = require("../models/InvestorProfile")
const Wallet = require("../models/Wallet")

const seedDemoUsers = async () => {
  try {
    // Check if Entrepreneur Demo exists
    const entrepreneurEmail = "EnDemo@gmail.com".toLowerCase()
    let entrepreneur = await User.findOne({ email: entrepreneurEmail })
    if (!entrepreneur) {
      entrepreneur = new User({
        name: "Entrepreneur Demo",
        email: entrepreneurEmail,
        password: "Demo@123", // Automatically hashed by user pre-save hook
        role: "entrepreneur",
        emailVerified: true,
      })
      await entrepreneur.save()
      console.log("🌱 Seeded Entrepreneur Demo user")

      // Create profile
      const profile = new EntrepreneurProfile({
        userId: entrepreneur._id,
        startupName: "Nexus Tech Solutions",
        industry: "Technology",
        foundedYear: 2024,
        teamSize: 12,
        fundingNeeded: "500000",
        pitchSummary: "Creating a revolutionary platform to bridge developers and business opportunities with modern AI collaboration.",
        bio: "Veteran tech entrepreneur building the future of peer networking.",
        location: "San Francisco, CA",
        isPublic: true,
      })
      await profile.save()
      console.log("🌱 Seeded Entrepreneur Demo profile")

      // Create wallet
      const wallet = await Wallet.getOrCreate(entrepreneur._id)
      await wallet.addFunds(5000)
    } else {
      entrepreneur.password = "Demo@123"
      entrepreneur.loginAttempts = 0
      entrepreneur.lockUntil = undefined
      entrepreneur.twoFactorEnabled = false
      await entrepreneur.save()
      console.log("🌱 Reset Entrepreneur Demo password")
    }

    // Check if Investor Demo exists
    const investorEmail = "InDemo@gmail.com".toLowerCase()
    let investor = await User.findOne({ email: investorEmail })
    if (!investor) {
      investor = new User({
        name: "Investor Demo",
        email: investorEmail,
        password: "Demo@123", // Automatically hashed by user pre-save hook
        role: "investor",
        emailVerified: true,
      })
      await investor.save()
      console.log("🌱 Seeded Investor Demo user")

      // Create profile
      const profile = new InvestorProfile({
        userId: investor._id,
        investorType: "angel",
        investmentInterests: ["Technology", "Healthcare", "Finance"],
        investmentStage: ["seed", "series-a"],
        minimumInvestment: "25000",
        maximumInvestment: "250000",
        bio: "Angel investor focusing on early-stage tech and high-growth SaaS startups.",
        location: "New York, NY",
        isPublic: true,
      })
      await profile.save()
      console.log("🌱 Seeded Investor Demo profile")

      // Create wallet
      const wallet = await Wallet.getOrCreate(investor._id)
      await wallet.addFunds(100000)
    } else {
      investor.password = "Demo@123"
      investor.loginAttempts = 0
      investor.lockUntil = undefined
      investor.twoFactorEnabled = false
      await investor.save()
      console.log("🌱 Reset Investor Demo password")
    }
  } catch (error) {
    console.error("❌ Seeding error:", error)
  }
}

module.exports = { seedDemoUsers }
