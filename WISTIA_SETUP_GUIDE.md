# 📺 Guia: Adicionar Vídeos Wistia na Plataforma

## ✅ Como Funciona

A plataforma agora suporta **vídeos Wistia 100% compatível**! Você pode adicionar vídeos de 3 formas:

### 🎯 Opção 1: Colar o ID Direto (Mais Rápido)
Se o código Wistia for:
```html
<wistia-player media-id="h79u3cdk5v" aspect="0.5625"></wistia-player>
```

**Cole no campo "Link do Vídeo":**
```
h79u3cdk5v
```

---

### 🎯 Opção 2: Colar Media ID com Atributo
**Cole no campo "Link do Vídeo":**
```
media-id="h79u3cdk5v"
```

Ou qualquer parte do código que contenha: `media-id="SEU_ID_AQUI"`

---

### 🎯 Opção 3: Colar o Código HTML Completo
Você pode colar o código INTEIRO do Wistia (com scripts e styles):
```html
<script src="https://fast.wistia.com/player.js" async></script>
<script src="https://fast.wistia.com/embed/h79u3cdk5v.js" async type="module"></script>
<style>wistia-player[media-id='h79u3cdk5v']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/h79u3cdk5v/swatch'); display: block; filter: blur(5px); padding-top:177.78%; }</style>
<wistia-player media-id="h79u3cdk5v" aspect="0.5625"></wistia-player>
```

A função de extração do ID é inteligente e vai encontrar o ID automaticamente! ✨

---

## 🖼️ Adicionar Capa / Thumbnail

### Para Wistia, use a URL automática:
```
https://fast.wistia.com/embed/medias/h79u3cdk5v/swatch
```

**Substitua `h79u3cdk5v` pelo seu ID Wistia.**

Ou faça o upload de uma imagem customizada usando o botão "Upload da Thumbnail/Capa".

---

## 📋 Passo a Passo Completo

1. **Vá para Admin → Conteúdos**
2. **Clique em "Novo Conteúdo"**
3. **Preencha:**
   - Título
   - Descrição (opcional)
   - Tipo: **Vídeo**
   - Categoria: Escolha a categoria
   
4. **No campo "Link do Vídeo", cole:**
   - ✅ Apenas o ID: `h79u3cdk5v`
   - ✅ O código completo
   - ✅ Qualquer uma das 3 opções acima

5. **Capa/Thumbnail:**
   - Use a URL automática: `https://fast.wistia.com/embed/medias/h79u3cdk5v/swatch`
   - OU faça upload de uma imagem

6. **Clique "Salvar"**

7. **Pronto!** O vídeo aparecerá automaticamente na seção "Vídeos" 🎉

---

## 🔍 Onde Encontrar o ID Wistia

1. Abra seu vídeo no Wistia
2. Clique em "Share"
3. Procure por `media-id="..."` no embed code
4. O ID é tudo entre as aspas: `h79u3cdk5v`

---

## ✨ Recursos Suportados

✅ Wistia (Novo!)
✅ YouTube  
✅ Google Drive  
✅ Links diretos para vídeos

---

## ❓ Precisa de Ajuda?

- O vídeo não aparece? Certifique-se que está selecionado "Ativo" ✓
- A capa não aparece? Use a URL automática do Wistia ou faça upload
- O vídeo não reproduz? Verifique se o ID está correto
