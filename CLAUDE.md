# CLAUDE.md

## Project Name

ThreadsGrowth AI

## Product Vision

ThreadsGrowth AI adalah platform SaaS untuk membantu creator, personal brand, UMKM, dokter, konsultan, dan bisnis mengembangkan akun Threads secara otomatis menggunakan AI.

Platform tidak hanya menjadwalkan posting, tetapi juga:

* AI Persona Management
* AI Content Research
* AI Content Generation
* Content Scheduling
* AI Auto Comment Reply
* Monitoring Dashboard
* Growth Analytics

Tujuan utama adalah membantu user meningkatkan engagement Threads dengan workflow yang hampir otomatis.

---

# Core Workflow

## 1. User Onboarding

User melakukan registrasi dan login.

Setelah login user diarahkan ke onboarding.

Flow:

Dashboard
→ Tambah Account
→ Buat Persona
→ Generate Konten
→ Schedule
→ Monitoring

---

# 2. Account Management

User dapat menambahkan beberapa akun Threads.

Source account menggunakan Repliz API.

Saat user klik Sync Account:

System:

1. Ambil daftar account dari Repliz
2. Simpan ke database
3. Tampilkan ke user

Table:

accounts

* id
* user_id
* repliz_account_id
* username
* display_name
* avatar_url
* status
* created_at

---

# 3. Persona Management

Setiap account wajib memiliki persona.

Persona digunakan untuk:

* generate ide
* generate konten
* generate komentar

Fields:

personas

* id
* account_id
* name
* description
* tone
* audience
* cta
* communication_style

Contoh:

Name:
Dokter Edukatif

Tone:
Friendly

Audience:
Masyarakat Umum

Style:
Bahasa sederhana dan mudah dipahami

---

# 4. Knowledge Base

Persona dapat memiliki knowledge base.

Knowledge Base digunakan untuk meningkatkan kualitas konten dan komentar.

Supported:

* PDF
* DOCX
* TXT

Table:

knowledge_bases

* id
* persona_id
* file_name
* embedding_status

Table:

knowledge_chunks

* id
* kb_id
* content
* embedding

Semua file harus diproses menjadi embedding dan disimpan di pgvector.

---

# 5. Content Research

Menu:
Research

User dapat meminta ide konten.

Input:

* Persona
* Jumlah ide

AI harus:

1. Membaca persona
2. Membaca histori konten
3. Menghindari duplikasi
4. Menghasilkan ide baru

Output:

content_ideas

* id
* account_id
* title
* angle
* hook
* status

Status:

* draft
* approved
* rejected

---

# 6. Content Generation

User memilih ide.

AI menghasilkan:

* title
* hook
* content
* CTA

Support:

* Single Post
* Thread Post

Table:

contents

* id
* account_id
* idea_id
* title
* content
* post_type
* status

Status:

* draft
* scheduled
* posted
* failed

---

# 7. Calendar Scheduling

User dapat drag and drop konten ke kalender.

Saat disimpan:

System:

POST ke Repliz Schedule API

Table:

schedules

* id
* content_id
* repliz_schedule_id
* scheduled_at
* status

Status:

* pending
* scheduled
* posted
* failed
* cancelled

---

# 8. Auto Comment AI

Fitur utama.

Saat Repliz mengirim webhook komentar:

Flow:

Webhook
→ Ambil Persona
→ Ambil Knowledge Base
→ Generate Reply
→ Kirim Reply ke Repliz

Mode:

1. Manual
2. Semi Auto
3. Full Auto

Table:

comments

* id
* content_id
* account_id
* comment_id
* username
* comment_text
* ai_reply
* reply_status

Reply Status:

* pending
* approved
* replied
* failed

---

# 9. Comment Inbox

User dapat melihat seluruh komentar.

Fitur:

* filter
* search
* approve AI reply
* edit AI reply
* resend

---

# 10. Monitoring Dashboard

Dashboard harus menjadi halaman utama.

Metrics:

## Account

* Total Accounts
* Active Accounts

## Content

* Draft
* Scheduled
* Posted
* Failed

## AI

* Ide Generated
* Content Generated
* AI Replies

## Engagement

* Comments Received
* Comments Replied
* Reply Rate

## System

* API Errors
* Webhook Errors
* Failed Jobs

---

# Technical Stack

Frontend:

* Next.js 16
* TypeScript
* Tailwind
* shadcn/ui

Backend:

* Supabase

Database:

* PostgreSQL
* pgvector

Authentication:

* Supabase Auth

Queue:

* Upstash Redis

AI:

Provider abstraction:

* OpenAI
* Gemini
* Claude

Default:

Gemini

Storage:

* Supabase Storage

---

# Repliz Integration

Credentials:

REPLIZ_USERNAME

REPLIZ_PASSWORD

Features:

* Sync Account
* Schedule Content
* Delete Schedule
* Auto Comment Reply

All communication with Threads must go through Repliz.

Never connect directly to Threads.

---

# SaaS Requirements

Every table must contain:

* created_at
* updated_at

All user data must be isolated using row level security.

Every API endpoint must verify ownership.

No user can access another user's account, content, comments, schedules, personas, or analytics.

---

# Future Features

Phase 2:

* Viral score prediction
* AI content optimization
* Competitor monitoring
* AI growth suggestions

Phase 3:

* Multi platform
* X
* LinkedIn
* Facebook
* Instagram Threads

Architecture must be designed from the beginning to support multi-platform expansion.

Kodingannya akan di commit di push di : 
https://github.com/hamzaharmanhusni-ugm/auto-thread-automation.git