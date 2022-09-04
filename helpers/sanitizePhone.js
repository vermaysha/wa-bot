
exports.sanitizePhone = (number) => {
  if (number.includes(':'))
      return number.slice(0, number.search(":")) + number.slice(number.search("@"))
  return number
}
