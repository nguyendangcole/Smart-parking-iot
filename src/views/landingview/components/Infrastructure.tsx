import { motion } from 'motion/react';
import { CheckCircle2, Radio, Shield } from 'lucide-react';
import iotImg from '../../../assets/images/infra_iot.png';
import cloudImg from '../../../assets/images/infra_cloud.png';

export default function Infrastructure() {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden" id="Features">
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="aspect-square bg-white/5 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 text-center border border-white/5"
              >
                <Radio size={48} className="text-accent-cyan" />
                <p className="font-bold text-lg">IoT Grid</p>
              </motion.div>
              <div className="aspect-[4/5] bg-white/5 rounded-3xl p-8 flex flex-col justify-end gap-4 border border-white/5 overflow-hidden relative">
                <img 
                  alt="Infrastructure" 
                  className="absolute inset-0 w-full h-full object-cover opacity-20" 
                  src={iotImg}
                />
                <p className="relative font-bold text-lg">Edge Nodes</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="aspect-[4/5] bg-white/5 rounded-3xl p-8 flex flex-col justify-end gap-4 border border-white/5 overflow-hidden relative">
                <img 
                  alt="Cloud" 
                  className="absolute inset-0 w-full h-full object-cover opacity-20" 
                  src={cloudImg}
                />
                <p className="relative font-bold text-lg">Realtime Sync</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="aspect-square bg-white/5 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 text-center border border-white/5"
              >
                <Shield size={48} className="text-primary" />
                <p className="font-bold text-lg">Secure Core</p>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight">
              Integrated <br /><span className="text-accent-cyan">IoT Infrastructure</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mt-6">
              Leveraging HCMUT's technical edge, our system connects high-precision sensors to a high-speed cloud backend, providing millisecond-accurate updates across the entire Bach Khoa network.
            </p>
            <ul className="space-y-4 mt-8">
              {[
                'Smart ultrasonic sensors for every slot',
                'AI-powered license plate recognition (ALPR)',
                'Centrally managed gate control unit',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-accent-cyan" />
                  <span className="font-medium text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
