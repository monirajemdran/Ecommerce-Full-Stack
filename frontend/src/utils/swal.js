import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const swalSuccess = (text, title = '') => {
  return MySwal.fire({
    icon: 'success',
    title: title || 'Success',
    text,
    showConfirmButton: false,
    timer: 1800,
    toast: true,
    position: 'top-end'
  });
};

export const swalSuccessModal = (text, title = '') => {
  return MySwal.fire({
    icon: 'success',
    title: title || 'Success',
    text,
    confirmButtonText: 'OK',
    toast: false,
    position: 'center'
  });
};

export const swalError = (text, title = '') => {
  return MySwal.fire({
    icon: 'error',
    title: title || 'Error',
    text,
    confirmButtonText: 'OK'
  });
};

export const swalInfo = (text, title = '') => {
  return MySwal.fire({
    icon: 'info',
    title: title || 'Info',
    text,
    confirmButtonText: 'OK'
  });
};

export const swalConfirm = async (text, title = 'Are you sure?') => {
  const result = await MySwal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  });
  return result.isConfirmed;
};

export default MySwal;
