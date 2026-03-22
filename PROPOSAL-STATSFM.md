# Proposal: Soulmates Web Version for Stats.fm

**To:** Stats.fm Team  
**From:** Dmitry Kazachkov  
**Date:** November 10, 2025

---

## Subject: Web Implementation of Soulmates Feature

Hi Stats.fm team!

I'm a paid Stats.fm user and was disappointed to learn that **Soulmates is only available on mobile**. As a web-only user, I decided to build a proof-of-concept myself.

### What I Built

I created **Synq** - a web-based music taste matching platform that:

✅ **Connects to Spotify OAuth**  
✅ **Analyzes top artists (up to 50)**  
✅ **Finds users with similar music taste**  
✅ **Shows match percentage** based on common artists  
✅ **Artist pages** showing who listens to each artist  
✅ **Three time ranges** (4 weeks, 6 months, lifetime)

**Tech Stack:**
- Node.js + Express
- Spotify Web API
- MongoDB Atlas
- Real-time matching algorithm

### Additional Features Built

📋 **Playlist Maker:**
- Extracts tracks from any Stats.fm profile
- Auto-searches missing Spotify IDs (99%+ success rate)
- Creates playlists automatically in Spotify
- Handles pagination (1000+ tracks)
- Real-time progress tracking

### Proposal

I'd like to offer my help to implement **Soulmates for Stats.fm Web**:

**Deliverables:**
- Full web implementation of Soulmates feature
- Match algorithm based on artists/genres/tracks
- Real-time updates
- Responsive design
- Integration with existing Stats.fm infrastructure

**Timeline:** 2-4 weeks  
**Compensation:** Open to discussion (reasonable rates for indie project)

**Demo Available:** I can show you the working prototype.

### Why Me?

- Already reverse-engineered Stats.fm API for playlist extraction
- Built working Spotify OAuth integration
- Understand your data structure
- Fast prototyping (built Synq + Playlist Maker in 1 day)
- Passionate about music discovery tools

### Contact

Email: bank@ya.ru  
Phone: +79161642164

Let me know if you're interested! Would love to contribute to Stats.fm.

---

**P.S.** Even if you're not interested in collaboration, I think Soulmates should be on web - it's a core feature that many users want!

Best regards,  
Dmitry

