'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { KeyRound, User, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/UIProvider';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast('Vui lòng nhập tên đăng nhập và mật khẩu', 'warn');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        username: username.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (res?.error) {
        toast('Tài khoản hoặc mật khẩu không đúng!', 'error');
      } else {
        toast('Đăng nhập thành công!', 'success');
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      toast('Lỗi hệ thống khi đăng nhập!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* ── CSS Style Embed ── */}
      <style>{`
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.15); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        .login-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080b11;
          overflow: hidden;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .glow-orb-1 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.02) 70%);
          top: -10%;
          left: 15%;
          animation: float 20s infinite ease-in-out;
        }

        .glow-orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(244,63,94,0.02) 70%);
          bottom: -8%;
          right: 12%;
          animation: float 25s infinite ease-in-out alternate;
        }

        .glow-orb-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(20,184,166,0.3) 0%, rgba(59,130,246,0.02) 70%);
          bottom: 25%;
          left: -5%;
          animation: float 16s infinite ease-in-out;
        }

        .login-glass-card {
          position: relative;
          width: 90%;
          max-width: 440px;
          padding: 45px 40px;
          background: rgba(13, 17, 28, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 28px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4),
                      0 0 50px rgba(99, 102, 241, 0.08);
          z-index: 10;
          animation: modalIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transition: all 0.3s ease;
        }

        .login-glass-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5),
                      0 0 60px rgba(99, 102, 241, 0.12);
        }

        .login-title-glow {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          margin-bottom: 4px;
        }

        .login-subtitle-glow {
          color: #94a3b8;
          font-size: 13.5px;
          text-align: center;
          margin-bottom: 36px;
        }

        .input-container {
          position: relative;
          margin-bottom: 22px;
        }

        .input-icon-wrapper {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.3s ease;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .input-glow {
          width: 100%;
          padding: 13px 16px 13px 44px;
          background: rgba(15, 23, 42, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.07) !important;
          border-radius: 14px !important;
          color: #f1f5f9 !important;
          font-size: 14px !important;
          outline: none !important;
          box-sizing: border-box;
          transition: all 0.3s ease !important;
        }

        .input-glow:focus {
          border-color: #6366f1 !important;
          background: rgba(15, 23, 42, 0.8) !important;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.22) !important;
        }

        .input-glow:focus + .input-icon-wrapper {
          color: #818cf8;
        }

        .btn-glow-submit {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 750;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
        }

        .btn-glow-submit:hover {
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
          box-shadow: 0 6px 22px rgba(99, 102, 241, 0.4);
          transform: translateY(-2px);
        }

        .btn-glow-submit:active {
          transform: translateY(0px);
        }

        .btn-glow-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      {/* Floating Animated Orbs */}
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>
      <div className="glow-orb glow-orb-3"></div>

      {/* Centered Glass Login Card */}
      <div className="login-glass-card">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ 
            width: 58, 
            height: 58, 
            borderRadius: 16, 
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 16,
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <Building2 size={28} color="#a5b4fc" />
          </div>
          <h1 className="login-title-glow">🏨 HOTEL OS</h1>
          <p className="login-subtitle-glow font-medium">Hệ thống Quản lý Vận hành Khách sạn</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username */}
          <div className="input-container">
            <input
              type="text"
              className="input-glow"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
            <div className="input-icon-wrapper">
              <User size={16} />
            </div>
          </div>

          {/* Password */}
          <div className="input-container" style={{ marginBottom: 28 }}>
            <input
              type="password"
              className="input-glow"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
            <div className="input-icon-wrapper">
              <KeyRound size={16} />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn-glow-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>


      </div>
    </div>
  );
}

