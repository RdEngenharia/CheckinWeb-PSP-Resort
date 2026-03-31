import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Hotel, Upload, Download, User, Calendar, Briefcase, Globe, Hash, CreditCard, Car, MapPin, Mail, Phone, Clock, Users, MessageCircle, CheckCircle } from 'lucide-react';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

interface FormData {
  nomeCompleto: string;
  dataNascimento: string;
  profissao: string;
  nacionalidade: string;
  idade: string;
  sexo: string;
  documentoNumero: string;
  documentoTipo: string;
  cpf: string;
  placaVeiculo: string;
  residenciaPermanente: string;
  cep: string;
  cidadeEstado: string;
  pais: string;
  email: string;
  ultimaProcedencia: string;
  proximoDestino: string;
  motivoViagem: string;
  meioTransporte: string;
  telefoneResidencial: string;
  telefoneComercial: string;
  dataEntrada: string;
  horaEntrada: string;
  dataSaida: string;
  horaSaida: string;
  acompanhantes: string;
  fnrh: string;
  registro: string;
  uhNo: string;
  codigoPais: string;
  codigoProf: string;
  codigoProced: string;
  codigoDestino: string;
}

const initialFormData: FormData = {
  nomeCompleto: '',
  dataNascimento: '',
  profissao: '',
  nacionalidade: '',
  idade: '',
  sexo: '',
  documentoNumero: '',
  documentoTipo: '',
  cpf: '',
  placaVeiculo: '',
  residenciaPermanente: '',
  cep: '',
  cidadeEstado: '',
  pais: '',
  email: '',
  ultimaProcedencia: '',
  proximoDestino: '',
  motivoViagem: 'Outro',
  meioTransporte: 'Automóvel',
  telefoneResidencial: '',
  telefoneComercial: '',
  dataEntrada: '',
  horaEntrada: '',
  dataSaida: '',
  horaSaida: '',
  acompanhantes: '',
  fnrh: '',
  registro: '',
  uhNo: '',
  codigoPais: '',
  codigoProf: '',
  codigoProced: '',
  codigoDestino: '',
};

// Logo padrão em Base64 como fallback caso o arquivo na pasta assets não seja encontrado
const FALLBACK_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxNzE3MTciIHJ4PSIxMCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjI0Ij5QT1JUTyBTRUdVUk88L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI3NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNjYThhMDQiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC13ZWlnaHQ9ImJsYWNrIiBmb250LXNpemU9IjI4Ij5QUkFJQSBSRVNPUlQ8L3RleHQ+Cjwvc3ZnPg==';
const ASSETS_LOGO_PATH = '/assets/hotel-logo.png';

export default function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [logo, setLogo] = useState<string>(ASSETS_LOGO_PATH);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('hotel-logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const handleLogoError = () => {
    if (logo === ASSETS_LOGO_PATH) {
      setLogo(FALLBACK_LOGO);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogo(base64);
        localStorage.setItem('hotel-logo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePDF = async () => {
    if (!pdfRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Forçar fundo branco
        onclone: (clonedDoc) => {
          // Garantir que o elemento clonado use cores simples
          const pdfElement = clonedDoc.getElementById('pdf-template');
          if (pdfElement) {
            pdfElement.style.color = '#000000';
            pdfElement.style.backgroundColor = '#ffffff';
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ficha_Hospede_${formData.nomeCompleto || 'Documento'}.pdf`);
      return imgData;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAndFinish = async () => {
    if (!formData.nomeCompleto || !formData.email) {
      setStatusMessage({ type: 'error', text: 'Por favor, preencha o nome e o e-mail. / Please fill in the name and e-mail. / Por favor, complete el nombre y el correo electrónico.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      // 1. Salvar no Realtime Database (Caminho: hospedes)
      const hospedesRef = ref(db, 'hospedes');
      const novoHospedeRef = push(hospedesRef);
      await set(novoHospedeRef, {
        ...formData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      // 2. Gerar e Baixar o PDF automaticamente (antes de limpar o formulário)
      await generatePDF();
      
      // 3. Limpar os campos do formulário para o próximo cliente
      setFormData(initialFormData);

      setStatusMessage({ 
        type: 'success', 
        text: 'Check-in realizado com sucesso! A ficha foi salva e o PDF baixado. / Check-in successful! The form was saved and the PDF downloaded. / ¡Check-in exitoso! La ficha fue guardada y el PDF descargado.' 
      });
    } catch (error) {
      console.error('Erro ao processar check-in:', error);
      setStatusMessage({ type: 'error', text: 'Erro ao processar o check-in. Tente novamente. / Error processing check-in. Try again. / Error al procesar el check-in. Inténtelo de nuevo.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-sm p-8 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-neutral-900 p-3 rounded-xl">
                <Hotel className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Sistema de Check-in / Check-in System / Sistema de Check-in</h1>
                <p className="text-neutral-500 text-sm italic font-serif">Ficha de Registro de Hóspedes / Guest Registration Form / Ficha de Registro de Huéspedes (FNRH)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="bg-white p-8 shadow-sm rounded-b-2xl">
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {statusMessage.text}
            </div>
          )}

          <form className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Row 1 */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <User size={14} /> Nome Completo / Full Name / Nombre Completo
              </label>
              <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Calendar size={14} /> Data de Nasc. / Date Born / Fecha de Nac.
              </label>
              <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>

            {/* Row 2 */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Briefcase size={14} /> Profissão / Occupation / Profesión
              </label>
              <input type="text" name="profissao" value={formData.profissao} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Globe size={14} /> Nacionalidade / Nationality / Nacionalidad
              </label>
              <input type="text" name="nacionalidade" value={formData.nacionalidade} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Hash size={14} /> Idade / Age / Edad
              </label>
              <input type="number" name="idade" value={formData.idade} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Sexo / Sex / Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm">
                <option value="">Selecione / Select / Seleccione</option>
                <option value="Masculino">Masculino / Male / Masculino</option>
                <option value="Feminino">Feminino / Female / Femenino</option>
              </select>
            </div>

            {/* Row 3 */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Doc. Identidade / Travel Doc / Doc. Identidad</label>
              <input type="text" name="documentoNumero" value={formData.documentoNumero} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" placeholder="Número / Number / Número" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Tipo / Type / Tipo</label>
              <input type="text" name="documentoTipo" value={formData.documentoTipo} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" placeholder="RG, Passaporte, Pasaporte..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">CPF</label>
              <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Car size={14} /> Placa / Plate / Matrícula
              </label>
              <input type="text" name="placaVeiculo" value={formData.placaVeiculo} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>

            {/* Row 4 */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <MapPin size={14} /> Residência Permanente / Permanent Address / Residencia Permanente
              </label>
              <input type="text" name="residenciaPermanente" value={formData.residenciaPermanente} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">CEP / Zip Code / C.P.</label>
              <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Cidade, Estado / City, State / Ciudad, Estado</label>
              <input type="text" name="cidadeEstado" value={formData.cidadeEstado} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>

            {/* Row 5 */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Mail size={14} /> E-mail
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Última Procedência / Arriving from / Última Procedencia</label>
              <input type="text" name="ultimaProcedencia" value={formData.ultimaProcedencia} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Próximo Destino / Next Destination / Próximo Destino</label>
              <input type="text" name="proximoDestino" value={formData.proximoDestino} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>

            {/* Row 6 - Motivo e Meio */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Motivo da Viagem / Purpose of Trip / Motivo del Viaje</label>
              <select name="motivoViagem" value={formData.motivoViagem} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm">
                <option value="Negócio">Negócio / Business / Negocio</option>
                <option value="Turismo">Turismo / Tourism / Turismo</option>
                <option value="Convenção">Convenção / Convention / Convención</option>
                <option value="Outro">Outro / Other / Otro</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Meio de Transporte / Arriving by / Medio de Transporte</label>
              <select name="meioTransporte" value={formData.meioTransporte} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm">
                <option value="Avião">Avião / Plane / Avión</option>
                <option value="Navio">Navio / Ship / Barco</option>
                <option value="Automóvel">Automóvel / Car / Automóvil</option>
                <option value="Ônibus">Ônibus / Bus / Autobús</option>
              </select>
            </div>

            {/* Row 7 - Telefones */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Phone size={14} /> Telefone Residencial / Home Telephone / Teléfono Residencial
              </label>
              <input type="text" name="telefoneResidencial" value={formData.telefoneResidencial} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Phone size={14} /> Telefone Comercial / Business Telephone / Teléfono Comercial
              </label>
              <input type="text" name="telefoneComercial" value={formData.telefoneComercial} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
            </div>

            {/* Row 8 - Entrada/Saída */}
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Entrada / Check-in / Entrada</label>
                <input type="date" name="dataEntrada" value={formData.dataEntrada} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                  <Clock size={14} /> Hora / Time / Hora
                </label>
                <input type="time" name="horaEntrada" value={formData.horaEntrada} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Saída / Check-out / Salida</label>
                <input type="date" name="dataSaida" value={formData.dataSaida} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                  <Clock size={14} /> Hora / Time / Hora
                </label>
                <input type="time" name="horaSaida" value={formData.horaSaida} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
              </div>
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
                <Users size={14} /> Acompanhantes / Companions / Acompañantes
              </label>
              <textarea name="acompanhantes" value={formData.acompanhantes} onChange={handleInputChange} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm h-20" placeholder="Nome dos acompanhantes / Names of companions / Nombre de los acompañantes..." />
            </div>

            <div className="md:col-span-4 pt-8">
              <button
                type="button"
                onClick={handleSubmitAndFinish}
                disabled={isSending || isGenerating}
                className="w-full bg-neutral-900 text-white font-bold py-4 rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
              >
                {isSending ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><CheckCircle size={20} /> Finalizar Check-in e Baixar PDF / Finish Check-in and Download PDF / Finalizar Check-in y Descargar PDF</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PDF Template (Matching the image) */}
      <div className="fixed -left-[9999px] top-0">
        <div id="pdf-template" ref={pdfRef} className="w-[210mm] min-h-[297mm] bg-white p-[10mm] text-black font-serif border-[1px] border-neutral-300" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
          {/* Header Box */}
          <div className="border-[1.5px] border-black rounded-xl p-4 mb-4 flex items-center justify-between" style={{ borderColor: '#000000' }}>
            <div className="flex items-center gap-4">
              {logo ? (
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="h-12 w-auto max-w-[60mm] object-contain" 
                  onError={handleLogoError}
                />
              ) : (
                <div className="bg-neutral-900 p-3 rounded">
                  <Hotel className="text-white w-10 h-10" />
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold uppercase mr-4">Ficha de Registro de Hóspedes</h1>
          </div>

          {/* Grid Layout */}
          <div className="border-[1px] border-black text-[9px]" style={{ borderColor: '#000000' }}>
            {/* Row 1 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Nome Completo / Full Name / Nombre Completo</p>
                <p className="font-bold text-sm h-6">{formData.nomeCompleto}</p>
              </div>
              <div className="w-48 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Data de Nasc. / Date Born / Fecha de Nac.</p>
                <p className="font-bold text-sm h-6 text-center">{formData.dataNascimento ? new Date(formData.dataNascimento).toLocaleDateString('pt-BR') : '/ /'}</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Profissão / Occupation / Profesión</p>
                <p className="font-bold text-sm h-6">{formData.profissao}</p>
              </div>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Nacionalidade / Nationality / Nacionalidad</p>
                <p className="font-bold text-sm h-6">{formData.nacionalidade}</p>
              </div>
              <div className="w-20 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Idade / Age / Edad</p>
                <p className="font-bold text-sm h-6 text-center">{formData.idade}</p>
              </div>
              <div className="w-48 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Sexo / Sex / Sexo</p>
                <div className="flex gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 border border-black flex items-center justify-center`} style={{ borderColor: '#000000' }}>{formData.sexo === 'Masculino' ? 'X' : ''}</div>
                    <span>Masc / Male / Masc</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 border border-black flex items-center justify-center`} style={{ borderColor: '#000000' }}>{formData.sexo === 'Feminino' ? 'X' : ''}</div>
                    <span>Fem / Female / Fem</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <div className="p-1 border-b border-black" style={{ borderBottomColor: '#000000' }}>
                  <p className="italic text-gray-500" style={{ color: '#737373' }}>Documento de Identidade / Travel Document / Doc. Identidad</p>
                </div>
                <div className="flex">
                  <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                    <p className="italic text-gray-500" style={{ color: '#737373' }}>Número / Number / Número</p>
                    <p className="font-bold text-sm h-6">{formData.documentoNumero}</p>
                  </div>
                  <div className="flex-1 p-1">
                    <p className="italic text-gray-500" style={{ color: '#737373' }}>Tipo / Type / Tipo</p>
                    <p className="font-bold text-sm h-6">{formData.documentoTipo}</p>
                  </div>
                </div>
              </div>
              <div className="w-48 border-r border-black p-1" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>CPF</p>
                <p className="font-bold h-12 flex items-center justify-center text-base">{formData.cpf}</p>
              </div>
              <div className="w-40 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Placa / Plate / Matrícula</p>
                <p className="font-bold h-12 flex items-center justify-center text-base">{formData.placaVeiculo}</p>
              </div>
            </div>

            {/* Row 4 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-[2] p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Residência Permanente / Permanent Address / Residencia Permanente</p>
                <p className="font-bold text-sm h-6">{formData.residenciaPermanente}</p>
              </div>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>CEP / Zip Code / C.P.</p>
                <p className="font-bold text-sm h-6">{formData.cep}</p>
              </div>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Cidade, Estado / City, State / Ciudad, Estado</p>
                <p className="font-bold text-sm h-6">{formData.cidadeEstado}</p>
              </div>
              <div className="flex-1 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>País / Country / País</p>
                <p className="font-bold text-sm h-6">{formData.pais || 'Brasil'}</p>
              </div>
            </div>

            {/* Row 5 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>E-mail</p>
                <p className="font-bold text-sm h-6">{formData.email}</p>
              </div>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Última Procedência / Arriving from / Última Procedencia</p>
                <p className="font-bold text-sm h-6">{formData.ultimaProcedencia}</p>
              </div>
              <div className="flex-1 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Próximo Destino / Next Destination / Próximo Destino</p>
                <p className="font-bold text-sm h-6">{formData.proximoDestino}</p>
              </div>
            </div>

            {/* Row 6 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Motivo da Viagem / Purpose of Trip / Motivo del Viaje</p>
                <div className="grid grid-cols-2 gap-y-1 mt-1">
                  {['Negócio/Business/Negocio', 'Turismo/Tourism/Turismo', 'Convenção/Convention/Convención', 'Outro/Other/Otro'].map(m => (
                    <div key={m} className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-black flex items-center justify-center" style={{ borderColor: '#000000' }}>{formData.motivoViagem === m.split('/')[0] ? 'X' : ''}</div>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Meio de Transporte / Arriving by / Medio de Transporte</p>
                <div className="grid grid-cols-2 gap-y-1 mt-1">
                  {['Avião/Plane/Avión', 'Navio/Ship/Barco', 'Automóvel/Car/Auto', 'Ônibus/Bus/Bus'].map(t => (
                    <div key={t} className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-black flex items-center justify-center" style={{ borderColor: '#000000' }}>{formData.meioTransporte === t.split('/')[0] ? 'X' : t === 'Automóvel/Car/Auto' && formData.meioTransporte === 'Automóvel' ? 'X' : ''}</div>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 7 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Assinatura do Hóspede / Guest's Signature / Firma del Huésped</p>
                <p className="text-xl font-bold mt-2">X</p>
              </div>
              <div className="w-64 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Telefone Residencial / Home Telephone / Tel. Residencial</p>
                <p className="font-bold text-sm h-8 mt-2">{formData.telefoneResidencial}</p>
              </div>
              <div className="w-64 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Telefone Comercial / Business Telephone / Tel. Comercial</p>
                <p className="font-bold text-sm h-8 mt-2">{formData.telefoneComercial}</p>
              </div>
            </div>

            {/* Row 8 */}
            <div className="flex border-b border-black" style={{ borderBottomColor: '#000000' }}>
              <div className="flex-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <div className="p-1 border-b border-black bg-gray-50" style={{ borderBottomColor: '#000000', backgroundColor: '#f9fafb' }}>
                  <p className="font-bold">Entrada / Check-in / Entrada</p>
                </div>
                <div className="flex p-1">
                  <div className="flex-1">
                    <p className="italic text-gray-500" style={{ color: '#737373' }}>Data / Date / Fecha</p>
                    <p className="font-bold text-sm">{formData.dataEntrada}</p>
                  </div>
                  <div className="flex-1">
                    <p className="italic text-gray-500" style={{ color: '#737373' }}>Hora / Time / Hora</p>
                    <p className="font-bold text-sm">{formData.horaEntrada}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <div className="p-1 border-b border-black bg-gray-50" style={{ borderBottomColor: '#000000', backgroundColor: '#f9fafb' }}>
                  <p className="font-bold">Saída / Check-out / Salida</p>
                </div>
                <div className="flex p-1">
                  <div className="flex-1">
                    <p className="italic text-gray-500" style={{ color: '#737373' }}>Data / Date / Fecha</p>
                    <p className="font-bold text-sm">{formData.dataSaida}</p>
                  </div>
                  <div className="flex-1">
                    <p className="italic text-gray-500" style={{ color: '#737373' }}>Hora / Time / Hora</p>
                    <p className="font-bold text-sm">{formData.horaSaida}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-1">
                <p className="italic text-gray-500" style={{ color: '#737373' }}>Acompanhantes / Companions / Acompañantes</p>
                <p className="font-bold text-[10px] leading-tight">{formData.acompanhantes}</p>
              </div>
            </div>

            {/* Row 9 */}
            <div className="flex">
              <div className="w-20 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="font-bold">FNRH</p>
                <p className="h-4 text-sm font-bold">{formData.fnrh}</p>
              </div>
              <div className="w-32 p-1 border-r border-black" style={{ borderRightColor: '#000000' }}>
                <p className="font-bold">Registro / Registration / Registro</p>
                <p className="h-4 text-sm font-bold">{formData.registro}</p>
              </div>
              <div className="w-24 p-1">
                <p className="font-bold">UH Nº / Room No / Hab. Nº</p>
                <p className="h-4 text-sm font-bold">{formData.uhNo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
