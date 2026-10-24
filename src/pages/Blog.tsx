import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Calendar, 
  Tag, 
  ArrowRight, 
  X, 
  Scale, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Plus,
  Printer,
  Download
} from 'lucide-react';
import { GoogleAdSense } from '../components/GoogleAdSense';
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  time?: string;
  readTime: string;
  excerpt: string;
  author: string;
  content: string[];
}

export const sampleArticles: BlogPost[] = [
  {
    id: '1',
    title: 'জমি রেজিস্ট্রেশন ও দলিলের যাবতীয় নিয়মাবলী: ক্রেতার সতর্কবার্তা',
    slug: 'land-registration-rules-bangladesh',
    category: 'ভূমি ও সম্পত্তি আইন',
    date: '১৬ অক্টোবর ২০২৬',
    readTime: '৫ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'জমি কেনার আগে সিএস, এসএ, আরএস ও বিএস খতিয়ান যাচাই, নামজারি ও সাব-রেজিস্ট্রি অফিসে দলিল রেজিস্ট্রেশনের সঠিক আইনি প্রক্রিয়া জানুন।',
    content: [
      'বাংলাদেশে জমি ক্রয়-বিক্রয়ের ক্ষেত্রে সবচেয়ে গুরুত্বপূর্ণ ধাপ হলো সঠিক কাগজপত্র যাচাই এবং রেজিস্ট্রেশন আইন ১৯০৮ অনুযায়ী দলিল রেজিস্ট্রি করা। যেকোনো জমি কেনার পূর্বে মূল মালিকানা ও দখলের সত্যতা নিশ্চিত করা জরুরি।',
      'প্রথমেই সংশ্লিষ্ট ভূমির সিএস (CS), এসএ (SA), আরএস (RS) এবং হাল বিএস (BS/City Survey) খতিয়ানের ধারাবাহিকতা মিলিয়ে দেখতে হবে। বিক্রেতার নামে সর্বশেষ নামজারি (Mutation) ও ডিসিআর (DCR) আছে কি-না এবং হাল সন পর্যন্ত ভূমি উন্নয়ন কর (খাজনা) পরিশোধ করা হয়েছে কি-না তা তহশিল অফিস থেকে নিশ্চিত করতে হবে।',
      'দলিল রেজিস্ট্রেশনের সময় সরকার নির্ধারিত স্ট্যাম্প ডিউটি, রেজিস্ট্রেশন ফি, স্থানীয় সরকার কর ও উৎস কর সঠিকভাবে ব্যাংকে পে-অর্ডারের মাধ্যমে জমা দিতে হয়। সাব-রেজিস্ট্রারের উপস্থিতিতে ক্রেতা ও বিক্রেতা বায়োমেট্রিক ও ছবি যাচাইয়ের মাধ্যমে রেজিস্ট্রি সম্পন্ন করেন।',
      'রেজিস্ট্রেশনের পর অবিলম্বে নতুন দলিলের সার্টিফাইড কপি ও মূল রসিদ সংগ্রহ করে সহকারী কমিশনার (ভূমি) বা এসি ল্যান্ড অফিসে নামজারির আবেদন করতে হবে। অন্যথায় ভবিষ্যতে স্বত্ব নিয়ে জটিলতা সৃষ্টি হতে পারে।'
    ]
  },
  {
    id: '2',
    title: 'আইনি নোটিশ (Legal Notice) কি, কেন এবং কীভাবে পাঠাবেন?',
    slug: 'how-to-send-legal-notice',
    category: 'লিগ্যাল প্র্যাকটিস',
    date: '১৪ অক্টোবর ২০২৬',
    readTime: '৪ মিনিট',
    author: 'অ্যাডভোকেট প্যানেল, এমডিসি কেসবুক',
    excerpt: 'আদালতে আনুষ্ঠানিক মোকদ্দমা দায়ের করার পূর্বে বিপক্ষকে আইনি নোটিশ প্রদান করার নিয়ম, সময়সীমা এবং এর গুরুত্ব সম্পর্কে বিস্তারিত।',
    content: [
      'আইনি নোটিশ হলো কোনো বিরোধ বা চুক্তি ভঙ্গের বিষয়ে বিজ্ঞ আইনজীবীর মাধ্যমে প্রতিপক্ষকে প্রদত্ত আনুষ্ঠানিক লিখিত সতর্কবার্তা। আদালতের শরণাপন্ন হওয়ার পূর্বে বিরোধটি নিষ্পত্তির সুযোগ দেওয়াই এর মূল উদ্দেশ্য।',
      'কোন কোন ক্ষেত্রে লিগ্যাল নোটিশ বাধ্যতামূলক? যেমন—চেক ডিজঅনারের মামলা (এনআই অ্যাক্ট ১৩৮ ধারা), চুক্তি ভঙ্গ, বাড়ি ভাড়া উচ্ছেদ, মানহানি বা দেনা আদayasের মতো বিষয়ে মামলা করার পূর্বে আইনি নোটিশ পাঠানো বাধ্যতামূলক বা অত্যন্ত কার্যকর একটি পদক্ষেপ।',
      'নোটিশে সাধারণত ঘটনার বিবরণ, প্রতিপক্ষের ত্রুটি, দাবিকৃত প্রতিকার এবং দাবি পূরণের জন্য নির্দিষ্ট সময়সীমা (যেমন ১৫ দিন বা ৩০ দিন) উল্লেখ করা হয়। এই নোটিশটি রেজিস্ট্রি ডাকযোগে প্রাপ্তি স্বীকারপত্র (A/D) সহ পাঠাতে হয়, যাতে প্রতিপক্ষ নোটিশ পেয়েছে তার প্রমাণ আদালতে পেশ করা যায়।',
      'যদি নির্ধারিত সময়সীমার মধ্যে প্রতিপক্ষ নোটিশের জবাব না দেয় কিংবা দাবি পূরণ না করে, তবে নোটিশ প্রেরক সরাসরি সংশ্লিষ্ট বিজ্ঞ আদালতে মামলা দায়েরের আইনগত অধিকার লাভ করেন।'
    ]
  },
  {
    id: '3',
    title: 'দেওয়ানী ও ফৌজদারী মামলার মূল পার্থক্য এবং বিচার প্রক্রিয়া',
    slug: 'civil-vs-criminal-case-procedure',
    category: 'মামলা পরিচালনা',
    date: '১২ অক্টোবর ২০২৬',
    readTime: '৬ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'দেওয়ানী মামলায় অধিকার ও সম্পত্তি পুনরুদ্ধার এবং ফৌজদারী মামলায় অপরাধের শাস্তি নিশ্চিতকরণ—দুই বিচার প্রক্রিয়ার স্পষ্ট পার্থক্য জানুন।',
    content: [
      'বাংলাদেশ বিচার ব্যবস্থায় মোকদ্দমা মূলত দুই ভাগে বিভক্ত: দেওয়ানী মোকদ্দমা (Civil Suit) এবং ফৌজদারী মামলা (Criminal Case)। এই দুই ধরণের মামলার উদ্দেশ্য, বিচারিক পদ্ধতি এবং ফলাফল সম্পূর্ণ ভিন্ন।',
      'দেওয়ানী মোকদ্দমার মূল লক্ষ্য হলো কোনো ব্যক্তির ব্যক্তিগত অধিকার, স্বত্ব বা সম্পত্তির দখল পুনরুদ্ধার করা। যেমন—জমির স্বত্ব ঘোষণা, বাটোয়ারা (বণ্টন), চুক্তি প্রবৃত্তি কিংবা ক্ষতিপূরণ আদায়। দেওয়ানী মামলায় সাধারণত কাউকে কারাদণ্ড দেওয়া হয় না, বরং ডিক্রি (Decree) প্রদানের মাধ্যমে অধিকার ফিরিয়ে দেওয়া হয়। এটি দেওয়ানী কার্যবিধি ১৯০৮ (CPC) দ্বারা পরিচালিত হয়।',
      'অন্যদিকে, ফৌজদারী মামলার উদ্দেশ্য হলো রাষ্ট্র ও সমাজের শান্তি ভঙ্গকারী অপরাধের শাস্তি নিশ্চিত করা। যেমন—চুরি, ডাকাতি, প্রতারণা, মারামারি কিংবা খুন। ফৌজদারী কার্যবিধি ১৮৯৮ (CrPC) এবং দণ্ডবিধি ১৮৬০ (Penal Code) অনুযায়ী এই বিচার পরিচালিত হয় এবং দোষী সাব্যস্ত হলে কারাদণ্ড বা অর্থদণ্ড প্রদান করা হয়।',
      'দেওয়ানী মামলার ধাপসমূহের মধ্যে রয়েছে আরজি দাখিল, সমন জারি, লিখিত জবাব (W/S), এডিআর (ADR), বিচার্য বিষয় গঠন (Framing of Issues), সাক্ষ্য গ্রহণ (P.H/F.H), যুক্তি-তর্ক এবং রায়। ফৌজদারী মামলায় এফআইআর বা সিআর পিটিশন, তদন্ত, চার্জশিট গঠন, জামিন শুনানি, সাক্ষ্য এবং ৩৪২ ধারায় পরীক্ষা সম্পন্ন হয়।'
    ]
  },
  {
    id: '4',
    title: 'চেক ডিজঅনার মামলা: এনআই অ্যাক্ট ১৩৮ ধারার শর্ত ও সময়সীমা',
    slug: 'cheque-dishonour-ni-act-138',
    category: 'ফৌজদারী ও বাণিজ্যিক আইন',
    date: '১০ অক্টোবর ২০২৬',
    readTime: '৫ মিনিট',
    author: 'অ্যাডভোকেট প্যানেল, এমডিসি কেসবুক',
    excerpt: 'অ্যাকাউন্টে পর্যাপ্ত টাকা না থাকার কারণে চেক প্রত্যাখ্যাত হলে আইনগত পদক্ষেপ নেওয়ার তামাদি মেয়াদ ও মামলা করার সঠিক ধাপ।',
    content: [
      'ব্যবসায়িক লেনদেন বা ব্যক্তিগত দায়ের বিপরীতে প্রদত্ত চেক ব্যাংকে পর্যাপ্ত টাকা না থাকার কারণে প্রত্যাখ্যাত (Dishonoured) হলে Negotiable Instruments Act, 1881-এর ১৩৮ ধারা অনুযায়ী ফৌজদারী অপরাধ হিসেবে গণ্য হয়।',
      'চেক ডিজঅনারের মামলা করার জন্য কঠোর সময়সীমা (Limitation Period) মেনে চলা বাধ্যতামূলক। চেকটি ইস্যু করার তারিখ হতে ৬ মাসের মধ্যে ব্যাংকে উপস্থাপন করতে হবে। ব্যাংক থেকে ডিজঅনার মেমো পাওয়ার ৩০ দিনের মধ্যে আইনজীবীর মাধ্যমে প্রতিপক্ষকে লিখিত লিগ্যাল নোটিশ পাঠাতে হবে।',
      'নোটিশ প্রাপ্তির পর প্রতিপক্ষকে টাকা পরিশোধের জন্য ৩০ দিন সময় দিতে হবে। এই ৩০ দিনের মধ্যে টাকা পরিশোধ না করলে পরবর্তী ৩০ দিনের মধ্যে সংশ্লিষ্ট বিজ্ঞ ম্যাজিস্ট্রেট আদালতে মামলা দায়ের করতে হবে। একটি সময়সীমাও অতিক্রম করলে মামলাটি তামাদি দোষে বাতিল হয়ে যেতে পারে।',
      'এই মামলায় দোষী সাব্যস্ত হলে আসামিকে সর্বোচ্চ ১ বছরের কারাদণ্ড অথবা চেকে উল্লেখিত টাকার সর্বোচ্চ ৩ গুণ পর্যন্ত অর্থদণ্ডে দণ্ডিত করা হতে পারে।'
    ]
  },
  {
    id: '5',
    title: 'ওকালতনামা কি এবং মামলা পরিচালনায় এর আইনি গুরুত্ব',
    slug: 'importance-of-vakalatnama',
    category: 'আইনি সচেতনতা',
    date: '৮ অক্টোবর ২০২৬',
    readTime: '৪ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'আদালতে মক্কেলের পক্ষে আইনজীবী নিয়োগের ক্ষমতাপত্র বা ওকালতনামা সম্পাদনের নিয়ম এবং ওকালতনামা ফি স্ট্যাম্প সংক্রান্ত বিধান।',
    content: [
      'ওকালতনামা হলো একটি লিখিত চুক্তিপত্র ও বিশেষ ক্ষমতাপত্র, যার মাধ্যমে একজন বিচারপ্রার্থী মক্কেল কোনো বিজ্ঞ আইনজীবীকে তার পক্ষে আদালতে কথা বলা, আবেদন দাখিল ও মামলা পরিচালনার পূর্ণ কর্তৃত্ব প্রদান করেন।',
      'দেওয়ানী কার্যবিধির অর্ডার ৩, রুল ৪ অনুযায়ী, বিজ্ঞ আদালতে কোনো পক্ষের প্রতিনিধিত্ব করতে হলে বৈধভাবে সম্পাদিত ওকালতনামা দাখিল করা বাধ্যতামূলক। ওকালতনামায় মক্কেলের স্বাক্ষর বা টিপসহি থাকতে হবে এবং আইনজীবী তা গ্রহণ করে স্বাক্ষর করেন।',
      'ওকালতনামায় যথাযথ কোর্ট ফি স্ট্যাম্প এবং বাংলাদেশ বার কাউন্সিল ও সংশ্লিষ্ট জেলা বার অ্যাসোসিয়েশনের নির্ধারিত কল্যাণ তহবিল স্ট্যাম্প যুক্ত করা আবশ্যক। অন্যথায় আদালত ওকালতনামাটি গ্রহণ করেন না।',
      'এমডিসি কেসবুক প্ল্যাটফর্মে আইনজীবীরা সহজে ডিজিটালভাবে ওকালতনামার রেকর্ড রাখতে পারেন এবং কোন মামলায় কোন মক্কেল ওকালতনামা প্রদান করেছেন তা যেকোনো সময় যাচাই করতে পারেন।'
    ]
  },
  {
    id: '6',
    title: 'উত্তরাধিকার সনদ ও মুসলিম ও হিন্দু সম্পত্তি বণ্টন আইন',
    slug: 'succession-inheritance-law-bangladesh',
    category: 'পারিবারিক ও সম্পত্তি আইন',
    date: '৫ অক্টোবর ২০২৬',
    readTime: '৬ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'মৃত ব্যক্তির ব্যাংক ব্যালেন্স ও স্থাবর সম্পত্তি বণ্টনের জন্য ওয়ারিশান সনদ ও সাকসেশন সার্টিফিকেট অর্জনের আইনি উপায়।',
    content: [
      'কোনো ব্যক্তি মারা গেলে তার রেখে যাওয়া স্থাবর ও অস্থাবর সম্পত্তির বণ্টনের ক্ষেত্রে ধর্মীয় উত্তরাধিকার আইন প্রযোজ্য হয়। মুসলিম উত্তরাধিকারীদের ক্ষেত্রে ফারায়েজ অনুযায়ী এবং হিন্দু উত্তরাধিকারীদের ক্ষেত্রে দায়ভাগ আইন অনুযায়ী অংশ নির্ধারিত হয়।',
      'স্থাবর সম্পত্তির (জমি, বাড়ি) ক্ষেত্রে স্থানীয় ইউনিয়ন পরিষদ, পৌরসভা বা সিটি কর্পোরেশন থেকে ওয়ারিশান সনদ সংগ্রহ করতে হয়। কিন্তু ব্যাংকে গচ্ছিত টাকা, সঞ্চয়পত্র বা শেয়ার হস্তান্তরের জন্য জেলা জজ আদালত থেকে Succession Act, 1925 অনুযায়ী সাকসেশন সার্টিফিকেট (Succession Certificate) নেওয়া বাধ্যতামূলক।',
      'যদি ওয়ারিশদের মধ্যে সম্পত্তি বণ্টন নিয়ে কোনো বিরোধ সৃষ্টি হয়, তবে যেকোনো ওয়ারিশ বিজ্ঞ দেওয়ানী আদালতে বণ্টন বা বাটোয়ারা মোকদ্দমা (Partition Suit) দায়ের করতে পারেন। আদালত একজন অ্যাডভোকেট কমিশনার নিয়োগের মাধ্যমে প্রত্যেকের ন্যায্য অংশ বুঝিয়ে দেন।'
    ]
  },
  {
    id: '7',
    title: 'জামিন (Bail) কি এবং বিজ্ঞ আদালত কোন কোন বিষয় বিবেচনা করেন?',
    slug: 'bail-law-principles-bangladesh',
    category: 'ফৌজদারী আইন',
    date: '৩ অক্টোবর ২০২৬',
    readTime: '৫ মিনিট',
    author: 'অ্যাডভোকেট প্যানেল, এমডিসি কেসবুক',
    excerpt: 'জামিনযোগ্য ও জামিন-অযোগ্য অপরাধের ক্ষেত্রে বিজ্ঞ ম্যাজিস্ট্রেট ও দায়রা আদালতে জামিন প্রার্থনার মূল আইনি নীতিমালা।',
    content: [
      'জামিন হলো বিচারাধীন অবস্থায় কোনো অভিযুক্ত ব্যক্তিকে আদালতের নিয়ন্ত্রণাধীনে নির্দিষ্ট জামিননামা (Bail Bond) সম্পাদনের শর্তে সাময়িক মুক্তি দেওয়া। ফৌজদারী কার্যবিধির ৪৯৬ ও ৪৯৭ ধারা অনুযায়ী জামিনের বিধান বর্ণিত রয়েছে।',
      'জামিনযোগ্য অপরাধের (Bailable Offence) ক্ষেত্রে জামিন পাওয়া অভিযুক্তের আইনি অধিকার। কিন্তু জামিন-অযোগ্য অপরাধের (Non-bailable Offence) ক্ষেত্রে জামিন প্রদান করা বিজ্ঞ আদালতের সম্পূর্ণ স্বেচ্ছাধীন ক্ষমতা (Discretionary Power)।',
      'আদালত জামিন দেওয়ার পূর্বে সাধারণত অপরাধের ভয়াবহতা, আসামির বয়স ও অসুস্থতা, তিনি নারী কি-না, তদন্তে ব্যাঘাত ঘটার সম্ভাবনা এবং তিনি পলাতক হতে পারেন কি-না—এই বিষয়গুলো বিবেচনা করেন। বিজ্ঞ হাইকোর্ট বিভাগ থেকে আগাম জামিন (Anticipatory Bail) নেওয়ারও বিধান রয়েছে।'
    ]
  },
  {
    id: '8',
    title: 'সাইবার অপরাধ ও অনলাইন প্রতারণার শিকার হলে আইনি প্রতিকার',
    slug: 'cyber-crime-legal-remedy-bangladesh',
    category: 'সাইবার ও প্রযুক্তি আইন',
    date: '১ অক্টোবর ২০২৬',
    readTime: '৪ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'ফেসবুক হ্যাকিং, ব্ল্যাকমেইলিং, ফেক আইডি ও অনলাইন আর্থিক প্রতারণা প্রতিরোধে জিডি ও সাইবার ট্রাইব্যুনালে অভিযোগ করার নিয়ম।',
    content: [
      'তথ্যপ্রযুক্তির প্রসারের সাথে সাথে সামাজিক যোগাযোগ মাধ্যমে ব্ল্যাকমেইলিং, নারীর ছবি বিকৃত করে ছড়িয়ে দেওয়া, ফেসবুক আইডি হ্যাক কিংবা ভুয়া ওটিপি দিয়ে টাকা হাতিয়ে নেওয়ার মতো ঘটনা আশঙ্কাজনকভাবে বেড়েছে।',
      'অনলাইনে প্রতারণা বা অপরাধের শিকার হলে সর্বপ্রথম প্রমাণ সংরক্ষণ করতে হবে—যেমন স্ক্রিনশট, অডিও-ভিডিও ক্লিপ এবং প্রোফাইল লিংক। এরপর নিকটস্থ থানায় সাধারণ ডায়েরি (GD) করতে হবে এবং বাংলাদেশ পুলিশের সিআইডি সাইবার পুলিশ সেন্টার বা ডিএমপি সাইবার ক্রাইম ইউনিটে অভিযোগ দায়ের করা যায়।',
      'সাইবার নিরাপত্তা আইনে দায়েরকৃত অপরাধের বিচার বিভাগীয় সাইবার ট্রাইব্যুনালে সম্পন্ন হয়। কোনো অবস্থাতেই অপরাধীর সাথে আপোষ না করে দ্রুততম সময়ে আইন প্রয়োগকারী সংস্থার সহায়তা নেওয়া উচিত।'
    ]
  },
  {
    id: '9',
    title: 'পারিবারিক আদালতে দেনমোহর ও খোরপোশ আদায়ের মোকদ্দমা',
    slug: 'family-court-dower-maintenance',
    category: 'পারিবারিক আইন',
    date: '২৮ সেপ্টেম্বর ২০২৬',
    readTime: '৫ মিনিট',
    author: 'অ্যাডভোকেট প্যানেল, এমডিসি কেসবুক',
    excerpt: 'পারিবারিক আদালত অধ্যাদেশ ১৯৮৫ অনুযায়ী দেনমোহর, বিবাহ বিচ্ছেদ পরবর্তী খোরপোশ এবং সন্তানের ভরণপোষণ আদায়ের নিয়ম।',
    content: [
      'পারিবারিক আদালত অধ্যাদেশ ১৯৮৫ (Family Courts Ordinance) অনুযায়ী সহকারী জজ আদালতকে পারিবারিক আদালত হিসেবে ক্ষমতা দেওয়া হয়েছে। বিবাহ বিচ্ছেদ, দেনমোহর, ভরণপোষণ (খোরপোশ), অভিভাবকত্ব ও দাম্পত্য অধিকার পুনরুদ্ধارهای বিষয়গুলো এখানে নিষ্পত্তি হয়।',
      'দেনমোহর হলো বিয়ের সময় স্বামীর ওপর স্ত্রীর একটি অবশ্য প্রদেয় আইনি অধিকার। এটি কোনো দয়া নয়। তলবমাত্র দেনমোহর (Prompt Dower) স্ত্রী যেকোনো সময় দাবি করতে পারেন এবং বিলম্বিত দেনমোহর (Deferred Dower) বিবাহ বিচ্ছেদ বা স্বামীর মৃত্যুর পর দাবি করা যায়।',
      'বিবাহ বিচ্ছেদ হলেও ইদ্দতকালীন খোরপোশ এবং নাবালক সন্তানের সাবালক হওয়া পর্যন্ত পূর্ণ ভরণপোষণ দেওয়া পিতার আইনগত দায়িত্ব। পারিবারিক আদালতের রায় না মানলে দেওয়ানী জেল ও মালামাল ক্রোকের আদেশ হতে পারে।'
    ]
  },
  {
    id: '10',
    title: 'সাধারণ ডায়েরি (GD) এবং এফআইআর (FIR)-এর মধ্যে মূল পার্থক্য',
    slug: 'difference-between-gd-and-fir',
    category: 'ফৌজদারী কার্যবিধি',
    date: '২৫ সেপ্টেম্বর ২০২৬',
    readTime: '৪ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'থানায় জিডি কখন করবেন এবং এজাহার বা এফআইআর কখন দায়ের করা হয়—আইনগত পার্থক্য ও কার্যকারিতা।',
    content: [
      'সাধারণ মানুষ প্রায়ই জিডি (General Diary) এবং এফআইআর (First Information Report)-কে একই মনে করেন, কিন্তু আইনি দিক থেকে এদের কার্যকারিতা সম্পূর্ণ ভিন্ন।',
      'জিডি মূলত কোনো অপ্রীতিকর ঘটনার আশঙ্কা, হুমকি কিংবা কোনো মূল্যবান নথিপত্র (যেমন সার্টিফিকেট, পাসপোর্ট, মোবাইল) হারানোর তথ্যাদি রেকর্ড করার জন্য করা হয়। এটি কোনো তাৎক্ষণিক মামলা নয়, বরং ভবিষ্যতের আইনি সুরক্ষা ও পুলিশি তদন্তের সূচনা।',
      'অন্যদিকে, যখন কোনো আমলযোগ্য অপরাধ (Cognizable Offence)—যেমন চুরি, খুন, মারামারি, ধর্ষণ সংঘটিত হয়, তখন ফৌজদারী কার্যবিধির ১৫৪ ধারা অনুযায়ী থানায় যে আনুষ্ঠানিক অভিযোগ দায়ের করা হয় তাকে এজাহার বা এফআইআর বলা হয়। এফআইআর রুজু হওয়ার সাথে সাথেই পুলিশ পরোয়ানা ছাড়া আসামিকে গ্রেফতার ও মামলার পূর্ণাঙ্গ তদন্ত শুরু করতে পারে।'
    ]
  },
  {
    id: '11',
    title: 'আদালতের দৈনিক কজলিস্ট (Cause List) দেখার সঠিক নিয়ম',
    slug: 'how-to-read-court-cause-list',
    category: 'লিগ্যাল প্র্যাকটিস',
    date: '২২ সেপ্টেম্বর ২০২৬',
    readTime: '৪ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'বিজ্ঞ আদালতের দৈনিক কার্যতালিকা থেকে মামলার ক্রমিক নম্বর, শুনানির পর্যায় ও পরবর্তী তারিখ ট্র্যাকিংয়ের উপায়।',
    content: [
      'আদালতের কজলিস্ট বা কার্যতালিকা হলো প্রতিদিন কোন কোন মামলার শুনানি কোন আদালতে অনুষ্ঠিত হবে তার সরকারি তালিকা। একজন আইনজীবীর প্রাত্যহিক দিনের সবচেয়ে গুরুত্বপূর্ণ দলিল এটি।',
      'কজলিস্টে সাধারণত মামলার নম্বর, উভয় পক্ষের নাম, বিজ্ঞ আইনজীবীদের নাম এবং শুনানির পদক্ষেপ (যেমন—সমন ফেরত, জবাব, চার্জ শুনানি, সাক্ষ্য বা আদেশ) ক্রমানুসারে সাজানো থাকে। কজলিস্টে মামলার সিরিয়াল কত নম্বরে আছে তার ওপর ভিত্তি করে আদালতে শুনানির প্রস্তুতি নিতে হয়।',
      'এমডিসি কেসবুক প্ল্যাটফর্মে আইনজীবীরা তাদের সকল মামলার কজলিস্ট এক নজরে স্বয়ংক্রিয়ভাবে দেখতে পারেন, ফলে কোনো মামলার সিরিয়াল মিস হওয়ার কোনো ঝুঁকি থাকে না।'
    ]
  },
  {
    id: '12',
    title: 'ডিজিটাল লিগ্যাল প্র্যাকটিস: আইনজীবীদের ক্লাউড ডায়েরির প্রয়োজনীয়তা',
    slug: 'benefits-of-digital-lawyer-diary',
    category: 'প্রযুক্তি ও আইন পেশা',
    date: '২০ সেপ্টেম্বর ২০২৬',
    readTime: '৫ মিনিট',
    author: 'লিগ্যাল রিসার্চ টিম, এমডিসি কেসবুক',
    excerpt: 'কাগজের ডায়েরি হারিয়ে যাওয়া রোধ, ক্লাউড অটো-সিঙ্ক ও মোবাইল অ্যাপ্লিকেশনের মাধ্যমে স্মার্ট চেম্বার ম্যানেজমেন্ট।',
    content: [
      'একবিংশ শতাব্দীতে লিগ্যাল প্র্যাকটিসে প্রযুক্তির ছোঁয়া ছাড়া দ্রুত ও পেশাদার সেবা দেওয়া প্রায় অসম্ভব। ঐতিহ্যবাহী কাগজের ডায়েরি বহন করা যেমন ভারী, তেমনি বৃষ্টিতে ভিজে যাওয়া, ছিঁড়ে যাওয়া কিংবা হারিয়ে যাওয়ার বিরাট ঝুঁকি থাকে।',
      'একটি ডিজিটাল ক্লাউড ডায়েরি যেমন এমডিসি কেসবুক (MDC Casebook) আইনজীবীদের সমস্ত মামলার ইতিহাস, পূর্ববর্তী আদেশ এবং পরবর্তী তারিখ ২৪ ঘণ্টা সুরক্ষিত রাখে। মোবাইল ফোন, ল্যাপটপ কিংবা ট্যাবলেট—যেকোনো ডিভাইস থেকে মুহূর্তেই পুরো চেম্বারের তথ্য দেখা যায়।',
      'এছাড়াও ক্লায়েন্টদের স্বয়ংক্রিয় এসএমএস পাঠানো, সহকারী মুহুরীদের কাজ বণ্টন এবং কজলিস্ট তৈরি করার মাধ্যমে সময় ও শ্রম উভয়ই সাশ্রয় হয়।'
    ]
  }
];

export const Blog: React.FC = () => {
  const [articles, setArticles] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('mdc_custom_blog_posts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...parsed, ...sampleArticles];
      } catch (e) {
        return sampleArticles;
      }
    }
    return sampleArticles;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Form states for creating a new post
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('আইনি সচেতনতা');
  const [newAuthor, setNewAuthor] = useState('এমডিসি কেসবুক এডমিন');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // Date & Time picker states
  const getTodayIso = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const getCurrentTimeIso = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [newDate, setNewDate] = useState<string>(getTodayIso);
  const [newTime, setNewTime] = useState<string>(getCurrentTimeIso);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const formatBanglaDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      if (isNaN(dateObj.getTime())) return dateStr;

      const bnDate = dateObj.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const mStr = minutes || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        const bnNums = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
        const toBn = (num: number | string) => String(num).replace(/[0-9]/g, digit => bnNums[Number(digit)]);
        return `${bnDate}, ${toBn(h12)}:${toBn(mStr)} ${ampm}`;
      }

      return bnDate;
    } catch (e) {
      return dateStr;
    }
  };

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrintOrSave = (article?: BlogPost | null) => {
    const target = article || activeArticle;
    if (!target) return;

    if (typeof window === 'undefined') return;

    if (isMobile) {
      // Mobile behavior: Download formatted document file & activate native PDF print/save
      try {
        const textContent = `${target.title}\nক্যাটাগরি: ${target.category}\nতারিখ: ${target.date} | লেখক: ${target.author}\nপাঠের সময়: ${target.readTime}\n\n${target.content.join('\n\n')}\n\n---------------------------------------\nএমডিসি কেসবুক (MDC Casebook) | www.mdccasebook.com\nডিজিটাল লিগ্যাল ম্যানেজমেন্ট প্ল্যাটফর্ম`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${target.title.replace(/[\s/\\:*?"<>|]/g, '_').substring(0, 50)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Mobile save text fallback:', err);
      }

      // Also open the browser's native print/save dialog (on Android/iOS this defaults to Save as PDF)
      try {
        window.print();
      } catch (e) {
        console.warn('Mobile print/save trigger:', e);
      }
    } else {
      // Computer / Desktop behavior: Clean iframe print without popup blocker or window.open errors
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html lang="bn">
            <head>
              <meta charset="UTF-8">
              <title>${target.title} - MDC Casebook</title>
              <style>
                body { font-family: 'Hind Siliguri', 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.8; }
                h1 { color: #1e1b4b; font-size: 24px; margin-bottom: 8px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
                .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
                .content p { margin-bottom: 14px; font-size: 14px; text-align: justify; }
                .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; text-align: center; }
              </style>
            </head>
            <body>
              <h1>${target.title}</h1>
              <div class="meta"><strong>ক্যাটাগরি:</strong> ${target.category} &nbsp;|&nbsp; <strong>তারিখ:</strong> ${target.date} &nbsp;|&nbsp; <strong>লেখক:</strong> ${target.author}</div>
              <div class="content">
                ${target.content.map((p: string) => `<p>${p}</p>`).join('')}
              </div>
              <div class="footer">
                MDC Casebook (এমডিসি কেসবুক) | www.mdccasebook.com | সর্বস্বত্ব সংরক্ষিত
              </div>
            </body>
            </html>
          `);
          doc.close();

          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (err) {
              window.print();
            } finally {
              setTimeout(() => {
                try {
                  document.body.removeChild(iframe);
                } catch (_) {}
              }, 3000);
            }
          }, 350);
        } else {
          window.print();
        }
      } catch (e) {
        window.print();
      }
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map(a => a.category)));
    return ['সকল', ...cats];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'সকল' || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, selectedCategory]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExcerpt.trim() || !newContent.trim()) {
      alert('দয়া করে শিরোনাম, সংক্ষিপ্ত বিবরণ এবং মূল কনটেন্ট লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      const contentParagraphs = newContent.split('\n\n').filter(Boolean);
      const publishDateFormatted = formatBanglaDate(newDate, newTime);
      const newPost: BlogPost = {
        id: 'post_' + Date.now(),
        title: newTitle.trim(),
        slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: newCategory,
        date: publishDateFormatted,
        time: newTime,
        readTime: '৪ মিনিট',
        excerpt: newExcerpt.trim(),
        author: newAuthor.trim() || 'এমডিসি কেসবুক ইউজার',
        content: contentParagraphs.length > 0 ? contentParagraphs : [newContent]
      };

      const updated = [newPost, ...articles];
      setArticles(updated);

      // Save custom posts to localStorage
      const customOnly = updated.filter(p => !sampleArticles.find(s => s.id === p.id));
      localStorage.setItem('mdc_custom_blog_posts', JSON.stringify(customOnly));

      // Also try saving to Firestore if connected
      try {
        await addDoc(collection(db, "blog_posts"), {
          ...newPost,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore sync optional error:", err);
      }

      setSuccessMessage('আপনার ব্লগ/ফিচার পোস্টটি সফলভাবে প্রকাশিত হয়েছে!');
      setNewTitle('');
      setNewExcerpt('');
      setNewContent('');
      setNewDate(getTodayIso());
      setNewTime(getCurrentTimeIso());
      setTimeout(() => {
        setSuccessMessage('');
        setShowPostModal(false);
        setSubmitting(false);
      }, 1500);
    } catch (err: any) {
      alert('পোস্ট প্রকাশে সমস্যা হয়েছে: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Blog Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <BookOpen size={14} />
            <span>আইনি সচেতনতা ও পরামর্শ কেন্দ্র</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              এমডিসি কেসবুক লিগ্যাল ব্লগ
            </h1>
            <button
              type="button"
              onClick={() => setShowPostModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle size={18} />
              <span>নতুন পোস্ট বা ফিচার লিখুন</span>
            </button>
          </div>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            বাংলাদেশের প্রচলিত দেওয়ানী, ফৌজদারী, ভূমি ও পারিবারিক আইন সম্পর্কিত প্রামাণ্য বিশ্লেষণ ও সচেতনতামূলক প্রবন্ধ।
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আর্টিকেল খুঁজুন (যেমন: জমি রেজিস্ট্রেশন, চেক ডিজঅনার, জামিন, নোটিশ)..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* AdSense In-Feed Ad Banner */}
        <div className="mb-10">
          <GoogleAdSense />
        </div>

        {/* Article Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
            <BookOpen size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-300 font-bold text-base">আপনার অনুসন্ধানের সাথে কোনো আর্টিকেল পাওয়া যায়নি।</p>
            <p className="text-slate-500 text-xs mt-1">অন্য কোনো শব্দ দিয়ে আবার চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-slate-900/80 rounded-3xl border border-slate-800/80 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock size={12} />
                      {article.readTime}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h2>

                  <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar size={12} />
                    {article.date}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintOrSave(article);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                      title={isMobile ? "মোবাইলে সেভ করুন" : "কম্পিউটারে প্রিন্ট করুন"}
                    >
                      {isMobile ? <Download size={13} className="text-emerald-300" /> : <Printer size={13} className="text-emerald-300" />}
                      <span className="font-bold">প্রিন্ট/সেভ</span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/30">
                        {isMobile ? 'সেভ' : 'প্রিন্ট'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveArticle(article)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer group-hover:translate-x-0.5"
                    >
                      <span>সম্পূর্ণ পড়ুন</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* AdSense Bottom Ad Banner */}
        <div className="mt-14">
          <GoogleAdSense />
        </div>

      </div>

      {/* CREATE NEW POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <PlusCircle className="text-emerald-400" size={24} />
                <span>নতুন ব্লগ বা ফিচার পোস্ট প্রকাশ করুন</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {successMessage ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 size={48} className="mx-auto text-emerald-400 animate-bounce" />
                <p className="text-lg font-bold text-white">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">পোস্টের শিরোনাম (Title)*</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="যেমন: নতুন ডিজিটাল আদালত আইন ও আইনজীবী করণীয়"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">ক্যাটাগরি</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="আইনি সচেতনতা">আইনি সচেতনতা</option>
                      <option value="ভূমি ও সম্পত্তি আইন">ভূমি ও সম্পত্তি আইন</option>
                      <option value="মামলা পরিচালনা">মামলা পরিচালনা</option>
                      <option value="ফৌজদারী ও বাণিজ্যিক আইন">ফৌজদারী ও বাণিজ্যিক আইন</option>
                      <option value="পারিবারিক ও সম্পত্তি আইন">পারিবারিক ও সম্পত্তি আইন</option>
                      <option value="প্রযুক্তি ও আইন পেশা">প্রযুক্তি ও আইন পেশা</option>
                      <option value="ফিচার ও আপডেট">ফিচার ও আপডেট</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">লেখক / প্রকাশক</label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="যেমন: অ্যাডভোকেট রাশেদুল ইসলাম"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* আপলোড তারিখ ও সময় এন্ট্রি সেকশন */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                      <Calendar size={16} className="text-emerald-400" />
                      <span>ব্লগ আপলোড করার তারিখ ও সময় নির্ধারণ</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const [y, m, d] = newDate.split('-').map(Number);
                          if (y && m) setCalendarViewDate(new Date(y, m - 1, d || 1));
                        } catch (_) {}
                        setShowCalendarModal(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Calendar size={13} />
                      <span>📅 ক্যালেন্ডার পেজ খুলুন</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Date Picker Input */}
                    <div>
                      <label className="block font-medium text-slate-300 text-xs mb-1">
                        আপলোডের তারিখ (Date)*
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* Time Picker Input */}
                    <div>
                      <label className="block font-medium text-slate-300 text-xs mb-1">
                        আপলোডের সময় (Time)*
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          required
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Time Presets & Live Bangla Date Preview */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <Clock size={13} />
                      <span>নির্ধারিত সময়:</span>
                      <span className="text-white font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        {formatBanglaDate(newDate, newTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setNewDate(getTodayIso());
                          setNewTime(getCurrentTimeIso());
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        এখনকার সময়
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTime('10:00')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        ১০:০০ AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTime('15:00')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        ০৩:০০ PM
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">সংক্ষিপ্ত বিবরণ / সারসংক্ষেপ (Excerpt)*</label>
                  <textarea
                    required
                    rows={2}
                    value={newExcerpt}
                    onChange={(e) => setNewExcerpt(e.target.value)}
                    placeholder="ব্লগ বা ফিচারের সংক্ষিপ্ত বিবরণ যা কার্ডে প্রদর্শিত হবে..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">মূল কনটেন্ট (Content Paragraphs)*</label>
                  <textarea
                    required
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="বিস্তারিত আর্টিকেল বা ফিচার বিবরণ লিখুন। প্যারাগ্রাফ আলাদা করতে নতুন প্যারাগ্রাফ ব্যবহার করুন..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? 'প্রকাশ হচ্ছে...' : 'পোস্ট প্রকাশ করুন'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* INTERACTIVE CALENDAR PAGE MODAL (ক্যালেন্ডার পেজ) */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            
            {/* Calendar Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="text-emerald-400" size={20} />
                <h3 className="font-black text-white text-base">ক্যালেন্ডার পেজ (তারিখ নির্বাচন)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => {
                  setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center">
                <span className="font-black text-sm text-indigo-300 block">
                  {calendarViewDate.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {calendarViewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
                title="পরবর্তী মাস"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="text-rose-400">রবি</span>
              <span>সোম</span>
              <span>মঙ্গল</span>
              <span>বুধ</span>
              <span>বৃহঃ</span>
              <span className="text-emerald-400">শুক্র</span>
              <span>শনি</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate() }).map((_, idx) => {
                const day = idx + 1;
                const dateIso = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = newDate === dateIso;
                const isToday = getTodayIso() === dateIso;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setNewDate(dateIso);
                      setShowCalendarModal(false);
                    }}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-black scale-105 ring-2 ring-emerald-400/40'
                        : isToday
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const today = getTodayIso();
                  setNewDate(today);
                  setCalendarViewDate(new Date());
                  setShowCalendarModal(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
              >
                আজকের তারিখ
              </button>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READ FULL ARTICLE MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="inline-block text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 mb-2">
                  {activeArticle.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-2">
                  <span>{activeArticle.date}</span>
                  <span>•</span>
                  <span>{activeArticle.author}</span>
                  <span>•</span>
                  <span>{activeArticle.readTime} পাঠ</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handlePrintOrSave(activeArticle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer active:scale-95 border border-emerald-400/40"
                    title={isMobile ? "মোবাইলে সরাসরি সেভ করুন" : "কম্পিউটারে প্রিন্ট করুন"}
                  >
                    {isMobile ? <Download size={14} className="text-emerald-100" /> : <Printer size={14} className="text-emerald-100" />}
                    <span className="font-extrabold tracking-wide">প্রিন্ট/সেভ</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-200 font-bold border border-emerald-400/30">
                      {isMobile ? 'সেভ একটিভ' : 'প্রিন্ট একটিভ'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintOrSave(activeArticle)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/40 cursor-pointer active:scale-95"
                  title={isMobile ? "মোবাইলে সেভ করুন" : "কম্পিউটারে প্রিন্ট করুন"}
                >
                  {isMobile ? <Download size={14} /> : <Printer size={14} />}
                  <span>প্রিন্ট/সেভ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {activeArticle.content.map((paragraph, index) => (
                <p key={index} className="text-justify">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-2">
              <p className="font-bold text-slate-300">⚠️ আইনি সতর্কবার্তা (Legal Disclaimer):</p>
              <p>
                এই আর্টিকেলে বর্ণিত তথ্যাবলী কেবলমাত্র সাধারণ আইনি সচেতনতা ও শিক্ষার উদ্দেশ্যে সংকলিত। সুনির্দিষ্ট কোনো আইনি বিষয়ের ক্ষেত্রে বিজ্ঞ লাইসেন্সধারী আইনজীবীর সাথে সরাসরি পরামর্শ করার অনুরোধ করা হচ্ছে।
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>কেসবুক পোর্টালে যান</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  onClick={() => handlePrintOrSave(activeArticle)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-emerald-400/30"
                  title={isMobile ? "মোবাইলে সেভ করুন" : "কম্পিউটারে প্রিন্ট করুন"}
                >
                  {isMobile ? <Download size={14} /> : <Printer size={14} />}
                  <span className="font-bold">প্রিন্ট/সেভ</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-200 font-bold border border-emerald-400/30">
                    {isMobile ? 'সেভ' : 'প্রিন্ট'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Blog;
