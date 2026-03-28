

# HARIS — Human-Aware Risk Intelligence Shield

## Overview
A cybersecurity awareness tool that analyzes suspicious messages using AI and teaches users about cyber threats through gamified clue-based learning.

## Screen 1: Home / Analyzer
- Header with "HARIS" title, shield icon, Arabic subtitle "هاريس", and tagline
- Large textarea for pasting suspicious messages (Arabic/English)
- 3 pre-loaded example buttons (Phishing, Safe, Social Engineering) that auto-fill the textarea
- "Analyze with AI" button that calls Lovable AI via edge function
- Loading spinner during analysis

## Screen 2: Results (same page, below input)
- Animated risk score badge (counts up 0→final over 1s) with color coding: green (Safe), amber (Suspicious), red (Dangerous)
- Red alert banner for threats: "Do not click any links"
- **Clue Detective Game**: 3 clue cards revealed progressively with fade animations
  - Clue 1 (blue border) shown immediately
  - "Reveal next clue" button for Clue 2 (amber) and Clue 3 (red)
- **Guess the Attack**: Text input for user to guess the attack type, 3 attempts allowed, then reveal answer
- Explanation in English/Arabic with tab toggle (Arabic RTL-aligned)
- "Analyze another message" reset button

## Screen 3: About Page
- What HARIS does (3 bullets)
- Clue-based learning model explanation
- Supported threat types list
- Qatar AI Security Competition 2026 note

## Backend
- Lovable Cloud edge function for AI analysis using Lovable AI gateway
- System prompt instructing structured JSON response with risk score, clues, attack type, and bilingual explanations

## Design
- Clean white background, subtle gray cards, Inter font
- Color system: blue (info), amber (warning), red (danger), green (safe)
- Mobile responsive
- Calm, trustworthy feel — professional not alarming
- Smooth animations on clue reveals and score counting

## Navigation
- Simple top nav with Home and About links

