'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonDashboard() {
  const h1 = [30, 60, 40, 70, 50, 80, 45];
  const h2 = [20, 30, 25, 40, 35, 45, 20];
  const l1 = [10, 5, 20, 0];
  const w1 = [30, 20, 40, 25];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div>
          <div className="h-8 bg-slate-200 rounded-md w-48 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded-md w-32"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-slate-200 rounded-lg w-64 hidden md:block"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-10"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-28"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm h-32 flex flex-col justify-between">
            <div className="flex justify-between">
              <div>
                <div className="h-4 bg-slate-100 rounded w-24 mb-3"></div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-slate-100 shadow-sm h-96 flex flex-col">
          <div className="h-6 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-64 mb-8"></div>
          <div className="flex-1 flex items-end gap-4 justify-between pt-10">
             {[...Array(7)].map((_, i) => (
               <div key={i} className="w-full flex gap-1 items-end h-full">
                 <div className="w-1/2 bg-slate-200 rounded-t-sm" style={{ height: `${h1[i]}%` }}></div>
                 <div className="w-1/2 bg-slate-100 rounded-t-sm" style={{ height: `${h2[i]}%` }}></div>
               </div>
             ))}
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-100 shadow-sm h-96 flex flex-col">
          <div className="h-6 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-40 mb-8"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-[20px] border-slate-100"></div>
          </div>
        </div>
      </div>
      
      {/* Planning Skeleton */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm h-80">
        <div className="h-6 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-slate-100 rounded w-64 mb-10"></div>
        
        <div className="flex flex-col gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-24 h-4 bg-slate-200 rounded"></div>
              <div className="flex-1 h-8 bg-slate-50 rounded-lg relative">
                <div 
                  className="absolute h-5 bg-slate-200 rounded top-1.5" 
                  style={{ left: `${l1[i]}%`, width: `${w1[i]}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
