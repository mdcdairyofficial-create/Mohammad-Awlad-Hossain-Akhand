import React, { useState, useMemo } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { GoogleAdSense } from '../components/GoogleAdSense';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
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
      'কোন কোন ক্ষেত্রে লিগ্যাল নোটিশ বাধ্যতামূলক? যেমন—চেক ডিজঅনারের মামলা (এনআই অ্যাক্ট ১৩৮ ধারা), চুক্তি ভঙ্গ, বাড়ি ভাড়া উচ্ছেদ, মানহানি বা দেনা আদায়ের মতো বিষয়ে মামলা করার পূর্বে আইনি নোটিশ পাঠানো বাধ্যতামূলক বা অত্যন্ত কার্যকর একটি পদক্ষেপ।',
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
      'দেওয়ানী কার্যবিধির অর্ডার ৩, রুল ৪ অনুযায়ী, বিজ্ঞ আদালতে কোনো পক্ষের প্রতিনিধিত্ব করতে হলে বৈধভাবে সম্পাদিত ওকালতনামা দাখিল করা বাধ্যতামূলক। ওকালতনামায় মক্কেলের স্বাক্ষর বা টিপসহি থাকতে হয় এবং আইনজীবী তা গ্রহণ করে স্বাক্ষর করেন।',
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
      'পারিবারিক আদালত অধ্যাদেশ ১৯৮৫ (Family Courts Ordinance) অনুযায়ী সহকারী জজ আদালতকে পারিবারিক আদালত হিসেবে ক্ষমতা দেওয়া হয়েছে। বিবাহ বিচ্ছেদ, দেনমোহর, ভরণপোষণ (খোরপোশ), অভিভাবকত্ব ও দাম্পত্য অধিকার পুনরুদ্ধারের বিষয়গুলো এখানে নিষ্পত্তি হয়।',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(sampleArticles.map(a => a.category)));
    return ['সকল', ...cats];
  }, []);

  const filteredArticles = useMemo(() => {
    return sampleArticles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'সকল' || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Blog Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <BookOpen size={14} />
            <span>আইনি সচেতনতা ও পরামর্শ কেন্দ্র</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            এমডিসি কেসবুক লিগ্যাল ব্লগ
          </h1>
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

                  <button
                    type="button"
                    onClick={() => setActiveArticle(article)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer group-hover:translate-x-0.5"
                  >
                    <span>সম্পূর্ণ পড়ুন</span>
                    <ChevronRight size={14} />
                  </button>
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
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>{activeArticle.date}</span>
                  <span>•</span>
                  <span>{activeArticle.author}</span>
                  <span>•</span>
                  <span>{activeArticle.readTime} পাঠ</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
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

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <Link
                to="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>কেসবুক পোর্টালে যান</span>
                <ArrowRight size={14} />
              </Link>

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
