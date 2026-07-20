import { useState } from "react";
import { registerUserAction } from "@/features/auth/actions";
import { UserRole } from "@/features/users/types";
import { formatCpf, formatMatricula, removeNonDigits } from "@/lib/formatters";
import { isValidEmail } from "@/lib/validators";

export function useRegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    matricula: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: UserRole.Atendente,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.cpf || !formData.username || !formData.password || !formData.confirmPassword || !formData.matricula) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("O formato do e-mail é inválido.");
      setLoading(false);
      return;
    }

    const rawCpf = removeNonDigits(formData.cpf);
    if (rawCpf.length !== 11) {
      setError("O CPF deve conter exatamente 11 dígitos.");
      setLoading(false);
      return;
    }

    if (formData.matricula.length !== 6) {
      setError("A matrícula deve conter exatamente 6 dígitos.");
      setLoading(false);
      return;
    }

    const res = await registerUserAction({
      name: formData.name,
      email: formData.email,
      cpf: rawCpf,
      matricula: formData.matricula,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      guiche: null,
      services: [],
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Ocorreu um erro ao realizar o cadastro.");
    } else {
      setSuccess(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    if (name === "cpf") {
      value = formatCpf(value);
    } else if (name === "matricula") {
      value = formatMatricula(value);
    }

    setFormData({ ...formData, [name]: value });
  };

  return {
    formData,
    showPassword,
    error,
    success,
    loading,
    setShowPassword,
    handleSubmit,
    handleChange,
  };
}
