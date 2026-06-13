import Link from "next/link";
import {
  Plug,
  AtSign,
  UsersRound,
  Sparkles,
  CalendarDays,
  MessageCircle,
  BarChart3,
  Trash2,
  Bot,
  Rocket,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { McpGuide } from "@/components/mcp-guide";

export const metadata = { title: "Panduan — ThreadsGrowth AI" };

function Section({
  id,
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group scroll-mt-24 rounded-xl border bg-card shadow-sm open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <span className="flex-1 font-display text-base font-semibold tracking-tight">{title}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_b]:text-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </details>
  );
}

export default function PanduanPage() {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <>
      <PageHeader
        eyebrow="Bantuan"
        title="Panduan"
        description="Semua yang perlu kamu tahu untuk menjalankan ThreadsGrowth AI, dari awal sampai otomatis."
      />

      <Card className="mb-5 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <p className="font-display font-semibold">Alur singkat (5 langkah)</p>
          <ol className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            <li>1. Hubungkan Repliz di <Link href="/pengaturan" className="font-medium text-primary">Pengaturan</Link></li>
            <li>2. Sinkronkan akun Threads di <Link href="/akun" className="font-medium text-primary">Akun</Link></li>
            <li>3. Buat persona di <Link href="/persona" className="font-medium text-primary">Persona</Link></li>
            <li>4. Generate ide & konten di <Link href="/riset" className="font-medium text-primary">Riset Ide</Link></li>
            <li>5. Jadwalkan di <Link href="/kalender" className="font-medium text-primary">Kalender</Link>, pantau di <Link href="/dashboard" className="font-medium text-primary">Dashboard</Link></li>
          </ol>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Section icon={Plug} title="1. Hubungkan Repliz" defaultOpen>
          <p>
            Repliz adalah jembatan ke Threads. Semua posting dan balasan komentar lewat Repliz, jadi akun Threads-mu
            aman dan tidak perlu kamu hubungkan langsung.
          </p>
          <p>
            Buka <Link href="/pengaturan">Pengaturan</Link> &rarr; kartu <b>Koneksi Repliz</b>. Isi access key &amp;
            secret key dari dashboard Repliz, klik <b>Simpan</b>, lalu <b>Tes Koneksi</b>. Kalau muncul jumlah akun,
            berarti berhasil.
          </p>
        </Section>

        <Section icon={AtSign} title="2. Sinkronkan akun Threads">
          <p>
            Di menu <Link href="/akun">Akun</Link>, klik <b>Sinkronkan Akun</b>. Sistem menarik semua akun Threads
            yang terhubung di Repliz ke sini. Tiap akun bisa kamu atur mode balas otomatisnya di kartu akun.
          </p>
        </Section>

        <Section icon={UsersRound} title="3. Buat persona">
          <p>
            Persona adalah karakter merekmu, supaya AI tahu nada bicara, audiens, dan tujuan kontenmu. Tiap akun butuh
            minimal satu persona sebelum bisa generate.
          </p>
          <p>
            Buka <Link href="/persona">Persona</Link> &rarr; <b>Buat Persona</b>. Contoh: nama &ldquo;Dokter
            Edukatif&rdquo;, nada &ldquo;Ramah&rdquo;, audiens &ldquo;Masyarakat umum&rdquo;, gaya &ldquo;Bahasa
            sederhana&rdquo;. Persona pertama otomatis jadi persona utama.
          </p>
        </Section>

        <Section icon={Sparkles} title="4. Generate ide & konten">
          <p>
            Di <Link href="/riset">Riset Ide</Link>, pilih akun lalu klik <b>Generate Ide</b>. AI membaca persona dan
            judul konten lamamu agar tidak menghasilkan ide yang sama.
          </p>
          <p>
            Dari sebuah ide, pilih <b>Buat Single</b> (satu post) atau <b>Buat Nested</b> (thread berisi beberapa
            post). Hasilnya masuk ke <Link href="/konten">Konten</Link> sebagai draf.
          </p>
          <p>
            Kalau AI error (mis. kuota habis), akan muncul notifikasi merah berisi alasannya. Kamu bisa coba lagi atau
            ganti kunci AI di Pengaturan.
          </p>
        </Section>

        <Section icon={CalendarDays} title="5. Jadwalkan konten (+ generate manual)">
          <p>
            Di <Link href="/kalender">Kalender</Link>, tarik kartu draf ke tanggal untuk menjadwalkan (default jam
            08.00 WIB). Geser lagi untuk memindahkan, atau klik tanda silang untuk membatalkan.
          </p>
          <p>
            Mau bikin konten langsung dari kalender? Klik <b>+ Buat konten</b> di panel draf atau ikon plus pada
            tanggal, pilih akun, lalu tulis sendiri atau biarkan AI yang menulis. Konten tersimpan sebagai draf di
            tanggal itu.
          </p>
          <p>
            <b>Jadwal posting otomatis (mis. 3x seminggu).</b> Di <Link href="/pengaturan">Pengaturan</Link> &rarr;
            <b> Jadwal Posting Otomatis</b>, pilih hari (mis. Sen/Rab/Jum) + jam, lalu aktifkan. App otomatis mengambil
            draf paling lama dan menjadwalkannya ke slot itu lewat Repliz (Repliz yang memublikasikan tepat waktu).
            Pastikan ada draf di menu Konten dan cron aktif (lihat bagian Deploy).
          </p>
        </Section>

        <Section icon={MessageCircle} title="6. Auto-comment (balas komentar otomatis)">
          <p>
            Tiap akun punya mode balas di <Link href="/komentar">Komentar</Link> dan <Link href="/akun">Akun</Link>:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li><b>Manual</b>: kamu balas sendiri.</li>
            <li><b>Semi Otomatis</b>: AI menyiapkan draf balasan, kamu setujui dulu sebelum terkirim.</li>
            <li><b>Otomatis Penuh</b>: AI membalas dan langsung mengirim tanpa persetujuan. Pakai hati-hati.</li>
          </ul>
          <p>
            Di Pengaturan ada <b>Akun auto-comment</b>: berapa akun terhubung yang ikut mengomentari tiap postingan
            (untuk engagement). Isi 0 untuk mematikannya.
          </p>
          <p>
            <b>Komentar antar akun otomatis saat tayang.</b> Nyalakan di <Link href="/pengaturan">Pengaturan</Link> &rarr;
            Otomasi &rarr; &ldquo;Komentar antar akun otomatis saat tayang&rdquo; dan atur jeda (mis. 2 sampai 8 menit).
            Begitu konten tayang, akun lain menyusul berkomentar dengan jeda acak supaya terlihat natural, bukan
            serentak. Fitur ini butuh <b>cron aktif</b> (lihat bagian Deploy di bawah) dan webhook Repliz terpasang.
          </p>
          <p>
            Mau jalan manual? Buka <Link href="/konten">Konten</Link> &rarr; menu titik tiga pada konten yang sudah
            tayang &rarr; <b>Komentar antar akun</b>, lalu pilih <b>Jeda natural</b> (acak) atau <b>Kirim sekarang</b>.
            Lewat AI/MCP: pakai tool <code className="rounded bg-muted px-1">seed_comments</code>
            (<code className="rounded bg-muted px-1">schedule: true</code> untuk jeda natural).
          </p>
        </Section>

        <Section icon={BarChart3} title="7. Analitik konten">
          <p>
            Buka <Link href="/analitik">Analitik</Link> untuk melihat ringkasan: jumlah konten tayang, total komentar
            masuk, tingkat balasan, dan performa tiap konten (views &amp; komentar). Dari sini kamu tahu konten mana
            yang paling disukai audiens.
          </p>
        </Section>

        <Section icon={Trash2} title="8. Mengedit & menghapus konten">
          <p>
            Di <Link href="/konten">Konten</Link>, tiap baris punya menu titik tiga: lihat detail, jadwalkan, atau
            <b> hapus</b>. Penghapusan selalu minta konfirmasi dulu. Kalau konten sedang terjadwal, jadwalnya ikut
            dibatalkan di Repliz.
          </p>
        </Section>

        <Section id="mcp" icon={Bot} title="9. Kendalikan lewat AI (Claude Desktop, Cursor, dll.)">
          <p>
            Kamu bisa menyambungkan aplikasi ini ke asisten AI lewat MCP. Setelah tersambung, cukup bilang
            &ldquo;buatkan 3 ide untuk akun X lalu jadwalkan besok jam 9&rdquo; dan ia mengerjakannya di sini.
          </p>
          <p>
            Pertama, buat token di <Link href="/pengaturan#mcp">Pengaturan</Link> (bagian &ldquo;Kendalikan lewat
            AI&rdquo;) lewat tombol <b>Generate otomatis</b> atau isi sendiri. Lalu pilih aplikasimu di bawah dan
            tempel konfigurasinya:
          </p>
          <McpGuide appUrl={appUrl} />
        </Section>

        <Section id="deploy" icon={Rocket} title="10. Saat sudah di-deploy (Vercel / Dokploy)">
          <p>
            Setelah aplikasi online, semua config MCP di atas otomatis memakai domain aslimu (mis.
            <code className="rounded bg-muted px-1">https://app-kamu.com/api/mcp</code>), jadi tidak perlu kamu ubah
            manual. Yang penting: di server, isi variabel <code className="rounded bg-muted px-1">APP_URL</code> dengan
            domain final.
          </p>
          <p>
            Pastikan database sudah dimigrasi dan kredensial terisi. Langkah lengkap deploy + migrasi ada di file
            <code className="rounded bg-muted px-1">README.md</code> dan <code className="rounded bg-muted px-1">docs/DEPLOYMENT.md</code> di repo.
          </p>
        </Section>
      </div>
    </>
  );
}
